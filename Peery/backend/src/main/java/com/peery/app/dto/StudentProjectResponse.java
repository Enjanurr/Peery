package com.peery.app.dto;

import java.time.Instant;

public record StudentProjectResponse(
        Long id,
        String title,
        String description,
        Instant evalStartDate,
        Instant evalEndDate,
        StudentTeamResponse team
) {
}