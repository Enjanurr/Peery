package com.peery.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.peery.app.entity.RoleEntity;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record ProfileResponse(
        Long id,
        String email,
        String fullName,
        RoleEntity role,
        String studentNumber,
        String program,
        String employeeCode,
        String department
) {
}