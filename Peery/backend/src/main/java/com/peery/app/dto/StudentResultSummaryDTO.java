package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * What a student sees about themselves. Anonymized by construction:
 * there is no evaluator field, no per-evaluation breakdown, no comment timestamps.
 * ALWAYS-include keeps the JSON shape identical whether results are visible or hidden,
 * so a client (or a test) can whitelist the exact key set.
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record StudentResultSummaryDTO(
        Long projectId,
        String projectTitle,
        String teamName,
        ResultsVisibility visibility,
        Integer responseCount,
        Double overallAverage,
        Double overallPercent,
        List<CriterionResultDTO> criteria,
        List<String> comments,
        String message,
        Instant resultsReleasedAt
) {
}