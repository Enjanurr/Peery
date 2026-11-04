package com.peery.app.dto;

import java.util.List;

public record PendingEvaluationsResponse(
        Long projectId,
        long completedCount,
        long totalCount,
        List<PendingTeammateResponse> teammates
) {
}