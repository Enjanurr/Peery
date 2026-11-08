package com.peery.app.repository;

import com.peery.app.entity.PasswordResetTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {

    Optional<PasswordResetTokenEntity> findByTokenHash(String tokenHash);

    Optional<PasswordResetTokenEntity> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    /** Atomic "claim": returns 1 for exactly one caller even if two use the same link at once. */
    @Modifying(clearAutomatically = true)
    @Query("update PasswordResetTokenEntity t set t.usedAt = :now where t.id = :id and t.usedAt is null")
    int markUsed(@Param("id") Long id, @Param("now") Instant now);

    @Modifying(clearAutomatically = true)
    @Query("update PasswordResetTokenEntity t set t.usedAt = :now where t.userId = :userId and t.usedAt is null")
    int invalidateOpenTokens(@Param("userId") Long userId, @Param("now") Instant now);
}