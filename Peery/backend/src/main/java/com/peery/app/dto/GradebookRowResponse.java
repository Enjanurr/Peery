package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record GradebookRowResponse(
        Long studentId,
        String fullName,
        String teamName,
        Double computedPercent,
        Double overridePercent,
        Double finalPercent,
        boolean overridden,
        Instant overriddenAt,
        String overrideReason
) {
}