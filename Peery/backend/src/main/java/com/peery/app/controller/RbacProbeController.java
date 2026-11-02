package com.peery.app.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class RbacProbeController {

    @GetMapping("/student/ping")
    public Map<String, String> studentPing(Authentication authentication) {
        return Map.of("message", "student area ok", "user", authentication.getName());
    }

    @GetMapping("/instructor/ping")
    public Map<String, String> instructorPing(Authentication authentication) {
        return Map.of("message", "instructor area ok", "user", authentication.getName());
    }
}