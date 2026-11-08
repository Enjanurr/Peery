package com.peery.app.controller;

import com.peery.app.dto.ForgotPasswordRequest;
import com.peery.app.dto.ForgotPasswordResponse;
import com.peery.app.dto.ResetPasswordRequest;
import com.peery.app.service.PasswordService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public (under /api/auth/**). */
@RestController
@RequestMapping("/api/auth/password")
public class PasswordResetController {

    private final PasswordService passwordService;

    public PasswordResetController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PostMapping("/forgot")
    public ResponseEntity<ForgotPasswordResponse> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.requestReset(request.email());
        // Identical answer for known and unknown emails.
        return ResponseEntity.accepted().body(new ForgotPasswordResponse(
                "If an account exists for that email, a reset link has been sent."));
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> reset(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}