package com.peery.app.dto;

import java.time.Instant;
import java.util.List;

public record AttributionEvaluationResponse(
        Long evaluationId,
        String teamName,
        PersonRef evaluator,
        PersonRef evaluatee,
        List<ScoreResponse> scores,
        String comment,
        Instant submittedAt,
        Instant updatedAt
) {
}