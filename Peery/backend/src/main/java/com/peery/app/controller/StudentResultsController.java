package com.peery.app.controller;

import com.peery.app.dto.StudentResultSummaryDTO;
import com.peery.app.service.ResultsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Student-only. There is intentionally no way to ask for someone else's results. */
@RestController
@RequestMapping("/api/student")
public class StudentResultsController {

    private final ResultsService resultsService;

    public StudentResultsController(ResultsService resultsService) {
        this.resultsService = resultsService;
    }

    @GetMapping("/projects/{projectId}/results")
    public StudentResultSummaryDTO myResults(@PathVariable("projectId") Long projectId,
                                             Authentication authentication) {
        return resultsService.getStudentSummary(authentication.getName(), projectId);
    }
}