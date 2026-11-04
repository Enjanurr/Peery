package com.peery.app.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateEvaluationRequest(
        @Valid
        @NotEmpty(message = "At least one score is required")
        List<ScoreInput> scores,

        @Size(max = 1000, message = "Comment must be at most 1000 characters")
        String comment,

        @NotNull(message = "version is required")
        Long version
) {
}