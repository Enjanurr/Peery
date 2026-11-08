package com.peery.app.service;

import com.peery.app.dto.ProfileResponse;
import com.peery.app.dto.UpdateProfileRequest;
import com.peery.app.dto.UpdateProfileResponse;
import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.entity.UserProfileEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.UserAccountRepository;
import com.peery.app.repository.UserProfileRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final UserAccountRepository accountRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public ProfileService(UserRepository userRepository,
                          UserAccountRepository accountRepository,
                          UserProfileRepository profileRepository,
                          PasswordEncoder passwordEncoder,
                          Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        UserEntity user = currentUser(email);
        UserProfileEntity profile = profileRepository.findById(user.getId()).orElse(null);
        return toResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), profile);
    }

    @Transactional
    public UpdateProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        UserEntity user = currentUser(email);
        Long userId = user.getId();
        RoleEntity role = user.getRole();

        // Each role only has its own optional fields; anything else is a client bug, not something to ignore.
        boolean studentSentInstructorFields =
                role == RoleEntity.STUDENT && (hasText(request.employeeCode()) || hasText(request.department()));
        boolean instructorSentStudentFields =
                role == RoleEntity.INSTRUCTOR && (hasText(request.studentNumber()) || hasText(request.program()));
        if (studentSentInstructorFields || instructorSentStudentFields) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FIELD_NOT_FOR_ROLE",
                    "Some of those fields do not apply to your account type");
        }

        String fullName = request.fullName().trim();
        String newEmail = request.email().trim().toLowerCase(Locale.ROOT);
        boolean emailChanged = !newEmail.equals(user.getEmail());

        if (emailChanged) {
            // Email is the login identity, so changing it needs proof that the caller knows the password.
            if (!hasText(request.currentPassword())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "CURRENT_PASSWORD_REQUIRED",
                        "Enter your current password to change your email");
            }
            String hash = accountRepository.findPasswordHash(userId);
            if (hash == null || !passwordEncoder.matches(request.currentPassword(), hash)) {
                // 400, not 401: a 401 would make the frontend log the user out over a typo.
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CURRENT_PASSWORD",
                        "Current password is incorrect");
            }
            if (accountRepository.existsByEmailAndIdNot(newEmail, userId)) {
                throw emailTaken();
            }
        }

        try {
            accountRepository.updateNameAndEmail(userId, fullName, newEmail);
        } catch (DataIntegrityViolationException ex) {
            // Two people grabbing the same address at once: the unique constraint decides.
            throw emailTaken();
        }

        Instant now = clock.instant();
        UserProfileEntity profile = profileRepository.findById(userId)
                .orElseGet(() -> new UserProfileEntity(userId, now));
        profile.update(
                role == RoleEntity.STUDENT ? clean(request.studentNumber()) : null,
                role == RoleEntity.STUDENT ? clean(request.program()) : null,
                role == RoleEntity.INSTRUCTOR ? clean(request.employeeCode()) : null,
                role == RoleEntity.INSTRUCTOR ? clean(request.department()) : null,
                now);
        profileRepository.save(profile);

        return new UpdateProfileResponse(toResponse(userId, newEmail, fullName, role, profile), emailChanged);
    }

    // -------------------------------------------------------------- helpers

    private UserEntity currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));
    }

    private static ProfileResponse toResponse(Long id, String email, String fullName, RoleEntity role,
                                              UserProfileEntity profile) {
        return new ProfileResponse(
                id,
                email,
                fullName,
                role,
                profile == null ? null : profile.getStudentNumber(),
                profile == null ? null : profile.getProgram(),
                profile == null ? null : profile.getEmployeeCode(),
                profile == null ? null : profile.getDepartment());
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String clean(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private static ApiException emailTaken() {
        return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS",
                "An account with this email already exists");
    }
}