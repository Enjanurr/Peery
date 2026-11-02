package com.peery.app.dto;

import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.UserEntity;

import java.time.Instant;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        RoleEntity role,
        Instant createdAt
) {
    public static UserResponse from(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getCreatedAt());
    }
}