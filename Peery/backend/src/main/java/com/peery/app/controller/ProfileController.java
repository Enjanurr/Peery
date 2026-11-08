package com.peery.app.controller;

import com.peery.app.dto.ChangePasswordRequest;
import com.peery.app.dto.ProfileResponse;
import com.peery.app.dto.UpdateProfileRequest;
import com.peery.app.dto.UpdateProfileResponse;
import com.peery.app.service.PasswordService;
import com.peery.app.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Any signed-in user. The account is always the one in the JWT; an id is never accepted from the client. */
@RestController
@RequestMapping("/api/users/me")
public class ProfileController {

    private final ProfileService profileService;
    private final PasswordService passwordService;

    public ProfileController(ProfileService profileService, PasswordService passwordService) {
        this.profileService = profileService;
        this.passwordService = passwordService;
    }

    @GetMapping("/profile")
    public ProfileResponse profile(Authentication authentication) {
        return profileService.getProfile(authentication.getName());
    }

    @PutMapping("/profile")
    public UpdateProfileResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                               Authentication authentication) {
        return profileService.updateProfile(authentication.getName(), request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                               Authentication authentication) {
        passwordService.changePassword(authentication.getName(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}