package com.peery.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RevokeRequest(
        @NotBlank(message = "A reason is required")
        @Size(min = 10, max = 1000, message = "Reason must be 10 to 1000 characters")
        String reason
) {
}