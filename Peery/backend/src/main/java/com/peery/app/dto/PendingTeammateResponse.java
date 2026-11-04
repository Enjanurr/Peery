package com.peery.app.dto;

public record PendingTeammateResponse(
        Long evaluateeId,
        String evaluateeName,
        EvaluationStatus status,
        Long evaluationId
) {
}