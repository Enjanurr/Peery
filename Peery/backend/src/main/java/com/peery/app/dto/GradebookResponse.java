package com.peery.app.dto;

import java.util.List;

public record GradebookResponse(
        Long projectId,
        String projectTitle,
        EvaluationState evaluationState,
        List<GradebookRowResponse> rows
) {
}