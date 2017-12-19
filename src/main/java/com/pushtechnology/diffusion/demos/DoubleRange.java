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

import java.time.Instant;
import java.util.Random;

class DoubleRange {
    private static final Random RANDOM = new Random(Instant.now().toEpochMilli());

    private final double min;
    private final double max;

    DoubleRange(double min, double max) {
        this.min = min;
        this.max = max;
    }

    double getRandom() {
        return RANDOM.doubles(1, min, max).toArray()[0];
    }

    private double getSpread() {
        double spread = RANDOM.nextGaussian();
        if (spread > 2) {
            return 2.0;
        } else if (spread < -2) {
            return -2.0;
        }
        return spread;
    }

    DoubleRange getVariation(double spread) {
        double newMin = min + (getSpread() * spread);
        double newMax = max + (getSpread() * spread);

        return new DoubleRange(newMin, newMax);
    }
}
