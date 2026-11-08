package com.peery.app.service;

import com.peery.app.entity.PasswordResetTokenEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.PasswordResetTokenRepository;
import com.peery.app.repository.UserAccountRepository;
import com.peery.app.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Service
public class PasswordService {

    private static final Logger log = LoggerFactory.getLogger(PasswordService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long THROTTLE_SECONDS = 60;
    private static final int MAX_PASSWORD_BYTES = 72; // BCrypt silently ignores anything longer

    private final UserRepository userRepository;
    private final UserAccountRepository accountRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResetLinkSender linkSender;
    private final Clock clock;
    private final long ttlMinutes;
    private final String frontendUrl;

    public PasswordService(UserRepository userRepository,
                           UserAccountRepository accountRepository,
                           PasswordResetTokenRepository tokenRepository,
                           PasswordEncoder passwordEncoder,
                           ResetLinkSender linkSender,
                           Clock clock,
                           @Value("${peery.password-reset.ttl-minutes:30}") long ttlMinutes,
                           @Value("${peery.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.linkSender = linkSender;
        this.clock = clock;
        this.ttlMinutes = ttlMinutes;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    // --------------------------------------------------- signed-in password change

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));

        String hash = accountRepository.findPasswordHash(user.getId());
        if (hash == null || !passwordEncoder.matches(currentPassword, hash)) {
            // 400, not 401: a 401 would make the frontend log the user out over a typo.
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
        }
        if (currentPassword.equals(newPassword)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_UNCHANGED",
                    "The new password must be different from the current one");
        }
        requireEncodable(newPassword);

        accountRepository.updatePasswordHash(passwordEncoder.encode(newPassword), user.getId());
        log.info("Password changed for userId={}", user.getId());
    }

    // ------------------------------------------------------------ forgot password

    /**
     * Always completes normally, whether or not the email exists, so the endpoint cannot be used
     * to discover which addresses have accounts.
     */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        Optional<UserEntity> found = userRepository.findByEmail(email);
        if (found.isEmpty()) {
            return;
        }
        UserEntity user = found.get();
        Instant now = clock.instant();

        // One link per account per minute: stops mail flooding of a victim's inbox.
        Optional<PasswordResetTokenEntity> latest = tokenRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId());
        if (latest.isPresent() && latest.get().getCreatedAt().isAfter(now.minusSeconds(THROTTLE_SECONDS))) {
            return;
        }

        tokenRepository.invalidateOpenTokens(user.getId(), now);

        String rawToken = newToken();
        tokenRepository.save(new PasswordResetTokenEntity(
                user.getId(), sha256Hex(rawToken), now.plus(ttlMinutes, ChronoUnit.MINUTES), now));

        try {
            linkSender.send(user.getEmail(), user.getFullName(),
                    frontendUrl + "/reset-password?token=" + rawToken, ttlMinutes);
        } catch (RuntimeException ex) {
            // A mail failure must not turn into a different response that reveals the account exists.
            log.error("Could not send password reset link for userId={}", user.getId(), ex);
        }
    }

    // ----------------------------------------------------------------- reset

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        requireEncodable(newPassword);
        Instant now = clock.instant();

        PasswordResetTokenEntity token = tokenRepository.findByTokenHash(sha256Hex(rawToken.trim()))
                .filter(t -> t.getUsedAt() == null && t.getExpiresAt().isAfter(now))
                .orElseThrow(PasswordService::invalidToken);

        // Atomic claim: if two requests race with the same link, only one gets a row count of 1.
        if (tokenRepository.markUsed(token.getId(), now) == 0) {
            throw invalidToken();
        }

        accountRepository.updatePasswordHash(passwordEncoder.encode(newPassword), token.getUserId());
        tokenRepository.invalidateOpenTokens(token.getUserId(), now);
        log.info("Password reset completed for userId={}", token.getUserId());
    }

    // -------------------------------------------------------------- helpers

    private static void requireEncodable(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_TOO_LONG",
                    "Password is too long (72 bytes maximum)");
        }
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN",
                "This reset link is invalid or has expired");
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}