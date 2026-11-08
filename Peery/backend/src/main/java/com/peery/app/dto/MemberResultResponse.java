package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** Instructor view of one student. Aggregates only: no attribution of who rated whom. */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record MemberResultResponse(
        Long studentId,
        String fullName,
        long receivedCount,
        long givenCount,
        long expectedCount,
        Double overallAverage,
        Double overallPercent,
        List<CriterionResultDTO> criteria,
        List<String> comments
) {
}