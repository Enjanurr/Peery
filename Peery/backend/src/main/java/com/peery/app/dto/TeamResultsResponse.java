package com.peery.app.dto;

import java.util.List;

public record TeamResultsResponse(
        Long teamId,
        String teamName,
        int memberCount,
        long submittedCount,
        long expectedCount,
        List<MemberResultResponse> members
) {
}