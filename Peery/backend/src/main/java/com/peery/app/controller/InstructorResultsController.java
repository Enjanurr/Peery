package com.peery.app.controller;

import com.peery.app.dto.ProjectResultsResponse;
import com.peery.app.service.ResultsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Instructor-only (guarded by /api/instructor/** in SecurityConfig); ownership is checked in the service. */
@RestController
@RequestMapping("/api/instructor")
public class InstructorResultsController {

    private final ResultsService resultsService;

    public InstructorResultsController(ResultsService resultsService) {
        this.resultsService = resultsService;
    }

    @GetMapping("/projects/{projectId}/results")
    public ProjectResultsResponse projectResults(@PathVariable("projectId") Long projectId,
                                                 Authentication authentication) {
        return resultsService.getProjectResults(authentication.getName(), projectId);
    }
}