/*
 * Copyright (C) 2017,2020 Push Technology Ltd.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

package com.pushtechnology.diffusion.demos;

import com.pushtechnology.diffusion.client.Diffusion;
import com.pushtechnology.diffusion.client.callbacks.ErrorReason;
import com.pushtechnology.diffusion.client.features.TimeSeries;
import com.pushtechnology.diffusion.client.features.control.topics.MessagingControl;
import com.pushtechnology.diffusion.client.features.control.topics.TopicControl;
import com.pushtechnology.diffusion.client.features.TopicUpdate;
import com.pushtechnology.diffusion.client.session.Session;
import com.pushtechnology.diffusion.client.topics.details.TopicSpecification;
import com.pushtechnology.diffusion.client.topics.details.TopicType;
import com.pushtechnology.diffusion.datatype.json.JSON;
import com.pushtechnology.diffusion.datatype.json.JSONDataType;
import com.pushtechnology.repackaged.jackson.core.JsonToken;
import com.pushtechnology.repackaged.jackson.dataformat.cbor.CBORFactory;
import com.pushtechnology.repackaged.jackson.dataformat.cbor.CBORParser;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.locks.LockSupport;

import static com.pushtechnology.diffusion.datatype.DataTypes.JSON_DATATYPE_NAME;

public class Race {
    private static final JSONDataType JSON_DATA_TYPE = Diffusion.dataTypes().json();

    private final ArrayList<Team> teams;
    private final ArrayList<Car> cars;
    private final ArrayList<Car> sorted;
    private final RaceTrack raceTrack;
    private final long updateFrequency;
    private final Session session;
    private final String topic;
    private final TimeSeries timeSeries;
    private final DoubleRange reactionRange;
    private final int lapCount;

    private boolean isStartOfRace = true;

    public Race(
            long updateFrequency,
            Session session,
            DoubleRange reactionRange,
            RaceTrack racetrack,
            String topic,
            String retainedRange,
            int lapCount,
            ArrayList<Team> teams) throws InterruptedException, ExecutionException, TimeoutException {

        this.reactionRange = reactionRange;
        this.updateFrequency = updateFrequency;
        this.raceTrack = racetrack;
        this.session = session;
        this.teams = teams;
        this.topic = topic;
        this.lapCount = lapCount;

        cars = new ArrayList<>();
        sorted = new ArrayList<>();
        for (Team team : teams) {
            cars.addAll(team.getCars());
            sorted.addAll(team.getCars());
        }

        timeSeries = session.feature(TimeSeries.class);
        MessagingControl messaging = session.feature(MessagingControl.class);

        createTopics(retainedRange);

        // Prepare message request handler
        messaging.addRequestHandler(
                topic,
                JSON.class,
                JSON.class,
                new MessagingControl.RequestHandler<JSON, JSON>() {
                    @Override
                    public void onRequest(JSON json, RequestContext requestContext, Responder<JSON> responder) {
                        // Read request
                        CBORFactory factory = new CBORFactory();
                        CBORParser parser = null;
                        Map<String, String> request  = new HashMap<>();

                        try {
                            parser = factory.createParser(json.asInputStream());

                            if (parser.nextToken() != JsonToken.START_OBJECT) {
                                responder.reject("Invalid request." );
                                return;
                            }

                            while (true) {
                                String key = parser.nextFieldName();

                                if (key == null) {
                                    break;
                                }

                                request.put(key, parser.nextTextValue());
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                            responder.reject("Invalid request.");
                            return;
                        }

                        // Parse request
                        int id = Integer.parseUnsignedInt(request.get("id"));
                        int teamId = Integer.parseUnsignedInt(request.get("teamid"));

                        String times = teams.get(teamId).getCars().get(id).buildLapTimeJSON();
                        responder.respond(JSON_DATA_TYPE.fromJsonString(times));
                    }

                    @Override
                    public void onClose() {
                        System.out.println("Closing messaging control.");
                    }

                    @Override
                    public void onError(ErrorReason errorReason) {
                        System.out.println("Error in messaging control: " + errorReason.toString());
                    }
                });
    }

    void start() {
        System.out.println("updateFrequency is " + updateFrequency);
        final long nanoInterval = updateFrequency * 1000000;

        long deadline = System.nanoTime();

        while (true) {

            update(nanoInterval);
            if ( isStartOfRace ) {
                isStartOfRace = false;
            }

            // Update positions
            Collections.sort(sorted);

            int position = sorted.size();
            for (Car car : sorted ) {
                car.setPosition( position );
                position -= 1;
            }

            if (sorted.get(0).getLap() > lapCount) {
                reset();
            }

            // Send snapshot to Diffusion
            timeSeries.append(topic + "/updates", JSON.class, createJSON());

            deadline += nanoInterval;
            LockSupport.parkNanos(deadline - System.nanoTime());
        }
    }

    private void reset(){
        isStartOfRace = true;

        for (Car car : cars) {
            car.reset();
        }
    }

    private void update(final long elapsed) {
        final double elapsedSeconds = ((double)elapsed / 1000000000.0);

        double carPos;
        RaceTrack.Part currentPart;
        RaceTrack.Part nextPart;

        for (Car car : cars) {
            currentPart = raceTrack.getPart(car);
            nextPart = raceTrack.getNextPart(currentPart.getId());
            carPos = car.getLocation() * raceTrack.getLength();

            if (nextPart.isCurved() && carPos >= nextPart.getLocation() - 30) {
                car.decelerate(elapsedSeconds, reactionRange.getRandom());
            } else if ( currentPart.isCurved() && carPos <= nextPart.getLocation() - 30 ) {
                car.decelerate(elapsedSeconds, reactionRange.getRandom());
            } else {
                car.accelerate(elapsedSeconds, reactionRange.getRandom());
            }

            car.move(raceTrack.getLength(), elapsedSeconds);
        }
    }

    private JSON createJSON() {
        StringBuilder sb = new StringBuilder(cars.size() * 1024);
        sb.append('[');

        boolean first = true;
        for (Car car : cars) {
            if (first) {
                first = false;
            } else {
                sb.append(',');
            }
            car.buildJSON(sb);
        }

        sb.append(']');
        return JSON_DATA_TYPE.fromJsonString(sb.toString());
    }

    private void createTopics(String retainedRange) throws InterruptedException, ExecutionException, TimeoutException {
        final TopicControl topicControl = session.feature(TopicControl.class);
        final TopicUpdate topicUpdate = session.feature(TopicUpdate.class);
        final TopicSpecification stringTopicSpec = Diffusion.newTopicSpecification(TopicType.STRING);
        final TopicSpecification longTopicSpec = Diffusion.newTopicSpecification(TopicType.INT64);


        // Add track filename
        // Note: we remove the html prefix to not confuse the webserver
        final String trackFile;
        if ( raceTrack.getFileName().startsWith( "html/" ) ) {
            trackFile = raceTrack.getFileName().substring(5);
        } else {
            trackFile = raceTrack.getFileName();
        }

        topicUpdate.addAndSet(topic, stringTopicSpec, String.class, trackFile)
            .get(5, TimeUnit.SECONDS);

        // Add team count to teams topic
        final String teamsTopic = topic + "/teams";
        topicUpdate.addAndSet(teamsTopic, longTopicSpec, Long.class, (long)teams.size())
                .get(5, TimeUnit.SECONDS);

        for (Team team : teams) {
            // Add team name topic
            final String teamTopic = topic + "/teams/" + team.getID();
            topicUpdate.addAndSet(teamTopic, stringTopicSpec, String.class, team.getName())
                    .get(5, TimeUnit.SECONDS);

            // Add car count to cars topic
            final String carsTopic = topic + "/teams/" + team.getID() + "/cars";
            topicUpdate.addAndSet(carsTopic, longTopicSpec, Long.class, (long)team.getCarCount())
                    .get(5, TimeUnit.SECONDS);

            for (Car car : team.getCars()) {
                // Add car name topic
                final String carTopic = topic + "/teams/" + team.getID() + "/cars/" + car.getId();
                topicUpdate.addAndSet(carTopic, stringTopicSpec, String.class, car.getDriverName())
                        .get(5, TimeUnit.SECONDS);
            }
        }

        // Add time series topic for high-frequency car updates
        final TopicSpecification specification = topicControl.newSpecification(TopicType.TIME_SERIES)
                .withProperty(TopicSpecification.TIME_SERIES_EVENT_VALUE_TYPE, JSON_DATATYPE_NAME)
                .withProperty(TopicSpecification.TIME_SERIES_RETAINED_RANGE, retainedRange);

        final String timeSeriesTopicName = topic + "/updates";
        topicControl.addTopic(timeSeriesTopicName, specification)
                .thenAccept(result -> timeSeries.append(timeSeriesTopicName, JSON.class, createJSON()))
                .get(5, TimeUnit.SECONDS);
    }
}
