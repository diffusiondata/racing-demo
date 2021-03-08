/*
 * Copyright (C) 2017, 2021 Push Technology Ltd.

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

import java.util.ArrayList;

public class Car implements Comparable<Car> {
    private final int id;
    private final int teamId;
    private final String driverName;
    private final double acceleration;
    private final double deceleration;
    private final ArrayList<Double> lapTimes;
    private final DoubleRange speedRange;
    private final DoubleRange corneringRange;

    private double maxSpeed;
    private double cornering;
    private int lap = 1;
    private int position = 0;
    private double location = 0.0;
    private double currentSpeed = 0.0;
    private double previousLapTime = 0.0;
    private double currentLapTime = 0.0;
    private double lapDifference = 0.0;
    private double accelerationTime = -1;
    private double decelerationTime = -2;
    private double elapsedReactionTime = 0.0;

    public Car(
            int id,
            int teamId,
            String driverName,
            DoubleRange speedRange,
            DoubleRange corneringRange,
            double acceleration,
            double deceleration ) {

        this.id = id;
        this.teamId = teamId;
        this.driverName = driverName;
        this.speedRange = speedRange;
        this.corneringRange = corneringRange;
        this.maxSpeed = speedRange.getRandom() / 3.6; // km/h to m/s
        this.cornering = corneringRange.getRandom() / 3.6; // km/h to m/s
        this.acceleration = acceleration;
        this.deceleration = deceleration;

        this.lapTimes = new ArrayList<>();
    }

    void reset() {
        this.maxSpeed = speedRange.getRandom() / 3.6;
        this.cornering = corneringRange.getRandom() / 3.6;
        this.position = 0;
        this.location = 0.0;
        this.lap = 1;
        this.currentSpeed = 0.0;
        this.previousLapTime = 0.0;
        this.currentLapTime = 0.0;
        this.lapDifference = 0.0;
        this.accelerationTime = -1;
        this.decelerationTime = -2;
        this.elapsedReactionTime = 0.0;

        this.lapTimes.clear();
    }

    String getDriverName() {
        return driverName;
    }

    int getId() {
        return id;
    }

    double getLocation() { return location; }

    int getLap() { return lap; }

    void setPosition(int position) {
        this.position = position;
    }

    private double offsetSpeed(double speed) {
        if (lap <= 5) {
            return speed * (0.65 + ((lap / 5.0) * 0.15));
        }
        return speed;
    }

    void accelerate(double elapsedSeconds, double reactionTime) {
        if ( accelerationTime == -1 && decelerationTime == -2 ) {
            accelerationTime = reactionTime;
            elapsedReactionTime = 0.0;
            maxSpeed = offsetSpeed(speedRange.getRandom() / 3.6);
        } else if ( accelerationTime > -1 ){
            elapsedReactionTime += elapsedSeconds;
        }

        if ( accelerationTime == -2 || elapsedReactionTime >= accelerationTime ) {
            currentSpeed += acceleration * elapsedSeconds;
            if (currentSpeed > maxSpeed) {
                // Cap to max speed
                currentSpeed = maxSpeed;
            }
            elapsedReactionTime = accelerationTime;
            accelerationTime = -2;
            decelerationTime = -1;
        }
    }

    void decelerate(double elapsedSeconds, double reactionTime) {
        if ( decelerationTime == -1 && accelerationTime == -2 ) {
            decelerationTime = reactionTime;
            elapsedReactionTime = 0.0;
            cornering = offsetSpeed(corneringRange.getRandom() / 3.6);
        } else if ( decelerationTime > -1 ) {
            elapsedReactionTime += elapsedSeconds;
        }

        if ( decelerationTime == -2 || elapsedSeconds >= accelerationTime ) {
            currentSpeed -= deceleration * elapsedSeconds;
            if (currentSpeed < cornering) {
                // Cap to cornering speed
                currentSpeed = cornering;
            }
            elapsedReactionTime = accelerationTime;
            decelerationTime = -2;
            accelerationTime = -1;
        }
    }

    void move(double trackLength, double elapsedSeconds) {
        location += ( currentSpeed * elapsedSeconds ) / trackLength;
        currentLapTime += elapsedSeconds;

        if ( location >= 1.0 ) {
            location -= 1.0;
            lap += 1;

            // Account for overshoot in lap times
            double overhead = ( ( location * trackLength ) / currentSpeed );
            currentLapTime -= overhead;

            if ( previousLapTime != 0.0 ) {
                lapDifference = currentLapTime - previousLapTime;
            }

            previousLapTime = currentLapTime;
            currentLapTime = overhead;

            lapTimes.add(previousLapTime);
        }
    }

    void buildJSON(StringBuilder sb) {
        sb.append("{\"id\":")
                .append(id)
                .append(",\"team\":")
                .append(teamId)
                .append(",\"lap\":")
                .append(lap)
                .append(",\"loc\":")
                .append(location)
                .append(",\"pos\":")
                .append(position)
                .append(",\"speed\":")
                .append((int)(currentSpeed * 3.6)) //m/s to km/h
                .append(",\"t\":")
                .append(currentLapTime)
                .append(",\"pt\":")
                .append(previousLapTime)
                .append(",\"td\":")
                .append(lapDifference)
                .append('}');
    }

    String buildLapTimeJSON() {
        StringBuilder sb = new StringBuilder(lapTimes.size() * 10);
        sb.append("[");
        boolean first = true;
        for (double time : lapTimes) {
            if (first) {
                first = false;
            } else {
                sb.append(",");
            }
            sb.append(time);
        }
        sb.append("]");
        return sb.toString();
    }

    @Override
    public int compareTo(Car o) {
        int result = Integer.compare(lap, o.lap);
        if ( result == 0 ) {
            return Double.compare(location, o.location);
        }
        return result;
    }
}
