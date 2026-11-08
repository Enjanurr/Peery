package com.peery.app.dto;

import java.util.List;

public record AttributionResponse(
        Long projectId,
        String projectTitle,
        EvaluationState evaluationState,
        List<AttributionEvaluationResponse> evaluations
) {
}