package com.peery.app.dto;

/** Query projection: average score per (evaluatee, criterion). Carries no evaluator data. */
public record CriterionAverageRow(Long evaluateeId, Long criterionId, Double average) {
}