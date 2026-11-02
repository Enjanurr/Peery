package com.peery.app.service;

import com.peery.app.dto.AuthResponse;
import com.peery.app.dto.LoginRequest;
import com.peery.app.dto.RegisterRequest;
import com.peery.app.dto.UserResponse;
import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.UserRepository;
import com.peery.app.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final String instructorInviteCode;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       @Value("${app.instructor-invite-code}") String instructorInviteCode) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.instructorInviteCode = instructorInviteCode;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        // Anyone can call this endpoint, so instructor accounts need the invite code.
        if (request.role() == RoleEntity.INSTRUCTOR && !isValidInviteCode(request.inviteCode())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "INVALID_INVITE_CODE",
                    "A valid instructor invite code is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw emailTaken();
        }

        UserEntity user = new UserEntity(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                request.role());

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            // Two simultaneous sign-ups: the unique constraint is the final guard.
            throw emailTaken();
        }

        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        // Throws BadCredentialsException for unknown email or wrong password.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        return buildResponse(user);
    }

    private AuthResponse buildResponse(UserEntity user) {
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, "Bearer", tokenProvider.getExpirationSeconds(), UserResponse.from(user));
    }

    private boolean isValidInviteCode(String provided) {
        if (provided == null) {
            return false;
        }
        // Constant-time comparison
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                instructorInviteCode.getBytes(StandardCharsets.UTF_8));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static ApiException emailTaken() {
        return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS",
                "An account with this email already exists");
    }
}