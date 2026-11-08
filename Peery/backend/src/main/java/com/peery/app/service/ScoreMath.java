package com.peery.app.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Pure number helpers, kept separate so they can be unit-tested without Spring. */
public final class ScoreMath {

    private ScoreMath() {
    }

    /** Half-up at 2 decimals via BigDecimal; Math.round(x * 100) / 100.0 mis-rounds values like 3.005. */
    public static double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    /** Position of an average inside its criterion's own range, as 0-100. */
    public static double percent(double average, int minScore, int maxScore) {
        return (average - minScore) / (maxScore - minScore) * 100.0;
    }
}