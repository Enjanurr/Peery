package com.peery.app.dto;

public record CriterionResponse(
        Long id,
        String name,
        String description,
        int minScore,
        int maxScore
) {
}