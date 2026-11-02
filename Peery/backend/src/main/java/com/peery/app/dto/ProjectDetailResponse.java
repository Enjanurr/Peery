package com.peery.app.dto;

import java.time.Instant;
import java.util.List;

public record ProjectDetailResponse(
        Long id,
        String title,
        String description,
        Instant evalStartDate,
        Instant evalEndDate,
        long teamCount,
        long studentCount,
        Instant createdAt,
        List<TeamResponse> teams
) {
}