package com.peery.app.dto;

import java.time.Instant;

public record ProjectResponse(
        Long id,
        String title,
        String description,
        Instant evalStartDate,
        Instant evalEndDate,
        long teamCount,
        long studentCount,
        Instant createdAt
) {
}