package com.peery.app.dto;

import java.time.Instant;
import java.util.List;

/**
 * Returned only to the student who wrote the evaluation.
 * Deliberately has NO evaluator fields: nothing here can reveal who rated whom to anyone else.
 */
public record EvaluationResponse(
        Long id,
        Long projectId,
        Long evaluateeId,
        String evaluateeName,
        List<ScoreResponse> scores,
        String comment,
        Instant submittedAt,
        Instant updatedAt,
        Long version,
        boolean editable
) {
}