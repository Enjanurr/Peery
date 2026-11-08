package com.peery.app.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScoreAggregatorTest {

    private final ScoreAggregator aggregator = new ScoreAggregator();

    private static final List<ScoreAggregator.CriterionInfo> RUBRIC = List.of(
            new ScoreAggregator.CriterionInfo(1L, "Contribution", 1, 5),
            new ScoreAggregator.CriterionInfo(2L, "Reliability", 1, 5),
            new ScoreAggregator.CriterionInfo(3L, "Communication", 1, 5),
            new ScoreAggregator.CriterionInfo(4L, "Collaboration", 1, 5));

    @Test
    void computesOverallAverageAndPercentFromRawAverages() {
        Map<Long, Double> averages = Map.of(1L, 4.0, 2L, 3.0, 3L, 3.0, 4L, 3.0);

        ScoreAggregator.Aggregate result = aggregator.aggregate(RUBRIC, averages, List.of());

        assertEquals(3.25, result.overallAverage(), 0.0001);
        assertEquals(56.25, result.overallPercent(), 0.0001);   // (75 + 50 + 50 + 50) / 4
        assertEquals(4, result.criteria().size());
        assertEquals(4.0, result.criteria().get(0).average(), 0.0001);
    }

    @Test
    void criterionWithNoScoresHasNullAverageAndIsExcludedFromTheOverall() {
        Map<Long, Double> averages = Map.of(1L, 5.0, 2L, 3.0);   // criteria 3 and 4 have no scores

        ScoreAggregator.Aggregate result = aggregator.aggregate(RUBRIC, averages, List.of());

        assertNull(result.criteria().get(2).average());
        assertNull(result.criteria().get(3).average());
        assertEquals(4.0, result.overallAverage(), 0.0001);
    }

    @Test
    void noScoresAtAllGivesNullOverall() {
        ScoreAggregator.Aggregate result = aggregator.aggregate(RUBRIC, Map.of(), List.of());

        assertNull(result.overallAverage());
        assertNull(result.overallPercent());
    }

    @Test
    void commentsAreSortedAlphabeticallyTrimmedAndBlanksDropped() {
        ScoreAggregator.Aggregate result = aggregator.aggregate(
                RUBRIC, Map.of(), List.of("zebra effort", "  Great communicator.  ", "", "   ", "apple pie"));

        assertEquals(List.of("apple pie", "Great communicator.", "zebra effort"), result.comments());
    }

    @Test
    void roundingIsHalfUpAtTwoDecimals() {
        assertEquals(3.01, ScoreMath.round2(3.005), 0.0000001);   // Math.round(3.005 * 100) would give 3.00
        assertEquals(3.33, ScoreMath.round2(10.0 / 3.0), 0.0000001);
    }

    @Test
    void percentUsesEachCriterionsOwnRange() {
        assertEquals(0.0, ScoreMath.percent(1.0, 1, 5), 0.0001);
        assertEquals(100.0, ScoreMath.percent(5.0, 1, 5), 0.0001);
        assertEquals(50.0, ScoreMath.percent(5.5, 1, 10), 0.0001);
        assertTrue(ScoreMath.percent(3.0, 1, 5) > ScoreMath.percent(3.0, 1, 10));
    }
}