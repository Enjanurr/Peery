package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** One criterion's average. `average` is null when nobody has scored it yet. */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record CriterionResultDTO(
        Long criterionId,
        String criterionName,
        int minScore,
        int maxScore,
        Double average
) {
}