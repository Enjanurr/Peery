package com.peery.app.dto;

import com.peery.app.entity.OverrideAction;

import java.time.Instant;

public record GradeOverrideResponse(
        Long id,
        Long studentId,
        String studentName,
        OverrideAction action,
        Double overridePercent,
        Double computedPercent,
        String reason,
        Long instructorId,
        String instructorName,
        Instant createdAt
) {
}