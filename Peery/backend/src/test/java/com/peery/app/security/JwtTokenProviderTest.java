package com.peery.app.security;

import com.peery.app.entity.RoleEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";
    private static final String OTHER_SECRET = "another-secret-another-secret-123456";

    private final JwtTokenProvider provider = new JwtTokenProvider(SECRET, 60);

    @Test
    void generatedTokenCarriesEmailAndRole() {
        String token = provider.generateToken("student@school.edu", RoleEntity.STUDENT);

        Claims claims = provider.parse(token);

        assertEquals("student@school.edu", claims.getSubject());
        assertEquals("STUDENT", claims.get("role", String.class));
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String foreign = new JwtTokenProvider(OTHER_SECRET, 60)
                .generateToken("hacker@evil.com", RoleEntity.INSTRUCTOR);

        assertThrows(JwtException.class, () -> provider.parse(foreign));
    }

    @Test
    void expiredTokenIsRejected() {
        String expired = new JwtTokenProvider(SECRET, -1)
                .generateToken("student@school.edu", RoleEntity.STUDENT);

        assertThrows(ExpiredJwtException.class, () -> provider.parse(expired));
    }

    @Test
    void garbageTokenIsRejected() {
        assertThrows(JwtException.class, () -> provider.parse("not.a.jwt"));
    }

    @Test
    void shortSecretFailsFast() {
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider("too-short", 60));
    }
}