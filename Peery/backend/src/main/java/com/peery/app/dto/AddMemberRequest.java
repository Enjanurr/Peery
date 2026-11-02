package com.peery.app.dto;

import jakarta.validation.constraints.NotNull;

public record AddMemberRequest(
        @NotNull(message = "studentId is required")
        Long studentId
) {
}