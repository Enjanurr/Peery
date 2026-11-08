package com.peery.app.dto;

/** Query projection: a count per user (evaluations received or given). */
public record CountRow(Long userId, Long count) {
}