package com.peery.app.dto;

public record UpdateProfileResponse(ProfileResponse profile, boolean reauthRequired) {
}