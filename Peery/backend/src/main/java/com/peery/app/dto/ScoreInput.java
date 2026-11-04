package com.peery.app.dto;

import jakarta.validation.constraints.NotNull;

/** The allowed range comes from each criterion and is checked in the service. */
public record ScoreInput(
        @NotNull(message = "criterionId is required")
        Long criterionId,

        @NotNull(message = "score is required")
        Integer score
) {
}