package com.peery.app.dto;

/** Internal row for grouped count queries (JPQL constructor expression). */
public record ProjectCountRow(Long projectId, Long total) {
}