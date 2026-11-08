package com.peery.app.dto;

import java.time.Instant;
import java.util.List;

public record ProjectResultsResponse(
        Long projectId,
        String projectTitle,
        EvaluationState evaluationState,
        Instant evalEndDate,
        List<TeamResultsResponse> teams
) {
}