package com.peery.app.dto;

import com.peery.app.entity.UserEntity;

public record StudentSummaryResponse(Long id, String fullName, String email) {

    public static StudentSummaryResponse from(UserEntity user) {
        return new StudentSummaryResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}