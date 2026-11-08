package com.peery.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 255, message = "Email must be at most 255 characters")
        String email,

        @Size(max = 50, message = "Student number must be at most 50 characters")
        String studentNumber,

        @Size(max = 100, message = "Program must be at most 100 characters")
        String program,

        @Size(max = 50, message = "Employee code must be at most 50 characters")
        String employeeCode,

        @Size(max = 100, message = "Department must be at most 100 characters")
        String department,

        /** Required only when the email changes. */
        String currentPassword
) {
}