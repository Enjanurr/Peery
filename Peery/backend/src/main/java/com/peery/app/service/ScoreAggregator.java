package com.peery.app.service;

import com.peery.app.dto.CriterionResultDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/** Turns raw per-criterion averages into the numbers shown to users. No database, no Spring state. */
@Component
public class ScoreAggregator {

    public record CriterionInfo(Long id, String name, int minScore, int maxScore) {
    }

    public record Aggregate(Double overallAverage,
                            Double overallPercent,
                            List<CriterionResultDTO> criteria,
                            List<String> comments) {
    }

    /**
     * @param criteria            the rubric, already in display order
     * @param averageByCriterionId raw (unrounded) averages; a missing key means "nobody scored it"
     * @param comments            comments written ABOUT this person, in any order
     */
    public Aggregate aggregate(List<CriterionInfo> criteria,
                               Map<Long, Double> averageByCriterionId,
                               List<String> comments) {
        List<CriterionResultDTO> results = new ArrayList<>();
        List<Double> averages = new ArrayList<>();
        List<Double> percents = new ArrayList<>();

        for (CriterionInfo criterion : criteria) {
            Double average = averageByCriterionId.get(criterion.id());
            results.add(new CriterionResultDTO(
                    criterion.id(),
                    criterion.name(),
                    criterion.minScore(),
                    criterion.maxScore(),
                    average == null ? null : ScoreMath.round2(average)));
            if (average != null) {
                averages.add(average);
                percents.add(ScoreMath.percent(average, criterion.minScore(), criterion.maxScore()));
            }
        }

        // Round once, at the end, from the raw values (never an average of rounded numbers).
        return new Aggregate(
                meanOrNull(averages),
                meanOrNull(percents),
                results,
                anonymize(comments));
    }

    /** Alphabetical order carries no information about who wrote a comment or when. */
    private static List<String> anonymize(List<String> comments) {
        return comments.stream()
                .filter(c -> c != null && !c.isBlank())
                .map(String::trim)
                .sorted(String.CASE_INSENSITIVE_ORDER.thenComparing(Comparator.<String>naturalOrder()))
                .toList();
    }

    private static Double meanOrNull(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return ScoreMath.round2(mean);
    }
}