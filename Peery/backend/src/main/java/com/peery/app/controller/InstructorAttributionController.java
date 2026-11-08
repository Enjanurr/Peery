package com.peery.app.controller;

import com.peery.app.dto.AttributionResponse;
import com.peery.app.service.AttributionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instructor")
public class InstructorAttributionController {

    private final AttributionService attributionService;

    public InstructorAttributionController(AttributionService attributionService) {
        this.attributionService = attributionService;
    }

    @GetMapping("/projects/{projectId}/attribution")
    public AttributionResponse attribution(@PathVariable("projectId") Long projectId,
                                           Authentication authentication) {
        return attributionService.getAttribution(authentication.getName(), projectId);
    }
}