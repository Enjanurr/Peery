package com.peery.app.dto;

import java.time.Instant;

public record EvaluationWindowResponse(
        Long projectId,
        Instant evalStartDate,
        Instant evalEndDate,
        EvaluationState state,
        Instant serverTime
) {
}