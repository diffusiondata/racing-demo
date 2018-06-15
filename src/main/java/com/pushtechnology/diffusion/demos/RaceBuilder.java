/*
 * Copyright (C) 2017 Push Technology Ltd.

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

import com.pushtechnology.diffusion.client.session.Session;

import java.io.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Properties;
import java.util.Random;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

class RaceBuilder {
    static RaceBuilder create() {
        final Randomiser randomiser;
        try {
            randomiser = new Randomiser();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }

        return new RaceBuilder(randomiser);
    }

    private final Randomiser randomiser;

    private long updateFrequency = 0;
    private int teamCount = 0;
    private int carCount = 0;
    private int lapCount = 0;
    private String trackFilename = null;
    private Session session = null;
    private String topic = null;
    private String retainedRange = null;
    private DoubleRange speedRange = null;
    private DoubleRange corneringRange = null;
    private DoubleRange accelerationRange = null;
    private DoubleRange decelerationRange = null;
    private DoubleRange reactionRange = null;

    private RaceBuilder(Randomiser randomiser) {
        this.randomiser = randomiser;
    }

    RaceBuilder fromProperties() {
        Properties properties = new Properties();
        InputStream inputStream = null;

        try {
            String filename = "config/startup.properties";
            inputStream = Main.class.getClassLoader().getResourceAsStream(filename);
            if (inputStream == null) {
                System.out.println("Unable to find " + filename);
                return null;
            }
            properties.load(inputStream);

            trackFilename = readString(properties, "track"); // Read race track file
            teamCount = readUnsignedInteger(properties, "teams"); // Read number of teams
            carCount = readUnsignedInteger(properties, "cars"); // Read number of cars per team
            lapCount = readUnsignedInteger(properties, "laps"); // Read number of laps per race
            updateFrequency = readUnsignedLong(properties, "updatefreq"); // Read update frequency in milliseconds
            topic = readString(properties, "topic"); // Read topic
            retainedRange = readString(properties, "retainedrange"); // Read retained range for time series topics
            speedRange = readDoubleRange(properties, "minspeed", "maxspeed");  // Read speed range
            corneringRange = readDoubleRange(properties, "mincornering", "maxcornering");  // Read cornering range
            accelerationRange = readDoubleRange(properties, "minacceleration", "maxacceleration");  // Read acceleration range
            decelerationRange = readDoubleRange(properties, "mindeceleration", "maxdeceleration");  // Read deceleration range
            reactionRange = readDoubleRange(properties, "minreaction", "maxreaction");  // Read reaction range

            return this;
        } catch (IOException ex) {
            ex.printStackTrace();
            return null;

        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
        }
    }

    private static String readString(Properties properties, String name) throws IOException {
        String value = properties.getProperty(name);
        if ( value == null ) {
            throw new IOException( "Property '" + name + "' not defined." );
        }
        return value;
    }

    private static Integer readUnsignedInteger(Properties properties, String name) throws IOException {
        return Integer.parseUnsignedInt(readString(properties, name));
    }

    private static Long readUnsignedLong(Properties properties, String name) throws IOException {
        return Long.parseUnsignedLong(readString(properties, name));
    }

    private static DoubleRange readDoubleRange(Properties properties, String minName, String maxName) throws IOException {
        return new DoubleRange(
                Double.parseDouble(readString(properties, minName)),
                Double.parseDouble(readString(properties, maxName)));
    }

    RaceBuilder setDiffusionSession(Session session) {
        if (session == null) {
            throw new IllegalArgumentException("Session can't be null");
        }
        this.session = session;
        return this;
    }

    public Race build() {
        if (teamCount < 1) {
            throw new IllegalArgumentException("Need at least 1 team.");
        }
        if (teamCount > randomiser.getTeamNameCount()) {
            throw new IllegalArgumentException("Not enough team names provided.");
        }
        if (carCount < 1) {
            throw new IllegalArgumentException("Need at least 1 car per team.");
        }
        if (updateFrequency < 1) {
            throw new IllegalArgumentException("Minimum update frequency is 1ms.");
        }
        if (topic == null) {
            throw new IllegalArgumentException("Topic can't be null");
        }

        ArrayList<Team> teams = new ArrayList<>(teamCount);
        for (int iTeam = 0; iTeam < teamCount; iTeam += 1) {

            ArrayList<Car> cars = new ArrayList<>(carCount);
            for (int iCar = 0; iCar < carCount; iCar += 1) {
                Car car = new Car(
                        iCar,
                        iTeam,
                        randomiser.getNextDriverName(),
                        speedRange.getVariation(2),
                        corneringRange.getVariation(2),
                        accelerationRange.getRandom(),
                        decelerationRange.getRandom());
                cars.add(car);
            }

            teams.add(new Team(iTeam, randomiser.getNextTeamName(), cars));
        }

        RaceTrack track = null;
        try {
            track = new RaceTrack(trackFilename);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
        try {
            return new Race(
                    updateFrequency,
                    session,
                    reactionRange,
                    track,
                    topic,
                    retainedRange,
                    lapCount,
                    teams);

        } catch (InterruptedException
                | ExecutionException
                | TimeoutException e) {
            e.printStackTrace();
            return null;
        }
    }

    private static class Randomiser {
        private void readNames(String filename, ArrayList<String> list) throws IOException {
            ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

            try (BufferedReader br = new BufferedReader(new InputStreamReader(classLoader.getResourceAsStream(filename)))) {
                String line = br.readLine();

                while (line != null) {
                    list.add(line);

                    line = br.readLine();
                }
            }
        }

        private final ArrayList<String> firstNames = new ArrayList<>();
        private final ArrayList<String> lastNames = new ArrayList<>();
        private final ArrayList<String> teamNames = new ArrayList<>();
        private final Random random = new Random(Instant.now().toEpochMilli());

        private Randomiser() throws IOException {
            readNames("names/first.names", firstNames);
            readNames("names/last.names", lastNames);
            readNames("names/team.names", teamNames);
        }

        String getNextDriverName() {
            return firstNames.get(random.nextInt(firstNames.size())) +
                    ' ' +
                    lastNames.get(random.nextInt(lastNames.size()));
        }

        String getNextTeamName() {
            if (teamNames.size() == 0) {
                return null;
            }

            // Make sure team names get only used once
            int index = random.nextInt(teamNames.size());
            String name = teamNames.get(index);
            teamNames.remove(index);
            return name;
        }

        int getTeamNameCount() {
            return teamNames.size();
        }
    }
}
