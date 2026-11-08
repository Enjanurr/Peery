package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * A student's own final grade. Deliberately has NO reason field: instructors' override reasons
 * often refer to raters, so they stay instructor-only. computedPercent is null whenever
 * the Phase 4 anonymity threshold would hide the student's results.
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record StudentGradeResponse(
        Long projectId,
        Double computedPercent,
        Double finalPercent,
        boolean adjusted,
        Instant adjustedAt
) {
}