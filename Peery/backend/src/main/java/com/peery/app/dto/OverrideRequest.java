package com.peery.app.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record OverrideRequest(
        @NotNull(message = "overridePercent is required")
        @DecimalMin(value = "0.00", message = "Percent must be between 0 and 100")
        @DecimalMax(value = "100.00", message = "Percent must be between 0 and 100")
        @Digits(integer = 3, fraction = 2, message = "At most 2 decimal places")
        BigDecimal overridePercent,

        @NotBlank(message = "A reason is required")
        @Size(min = 10, max = 1000, message = "Reason must be 10 to 1000 characters")
        String reason
) {
}