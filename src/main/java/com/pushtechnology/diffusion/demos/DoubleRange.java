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
