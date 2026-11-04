package com.peery.app.controller;

import com.peery.app.dto.CreateEvaluationRequest;
import com.peery.app.dto.CriterionResponse;
import com.peery.app.dto.EvaluationResponse;
import com.peery.app.dto.EvaluationWindowResponse;
import com.peery.app.dto.PendingEvaluationsResponse;
import com.peery.app.dto.UpdateEvaluationRequest;
import com.peery.app.service.EvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/** Student-only (guarded by /api/student/** in SecurityConfig). The caller always comes from the JWT. */
@RestController
@RequestMapping("/api/student")
public class StudentEvaluationController {

    private final EvaluationService evaluationService;

    public StudentEvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping("/projects/{projectId}/evaluation-window")
    public EvaluationWindowResponse window(@PathVariable("projectId") Long projectId,
                                           Authentication authentication) {
        return evaluationService.getWindow(authentication.getName(), projectId);
    }

    @GetMapping("/projects/{projectId}/criteria")
    public List<CriterionResponse> criteria(@PathVariable("projectId") Long projectId,
                                            Authentication authentication) {
        return evaluationService.getCriteria(authentication.getName(), projectId);
    }

    @GetMapping("/evaluations/pending")
    public PendingEvaluationsResponse pending(@RequestParam("projectId") Long projectId,
                                              Authentication authentication) {
        return evaluationService.getPending(authentication.getName(), projectId);
    }

    @GetMapping("/evaluations/mine")
    public List<EvaluationResponse> mine(@RequestParam("projectId") Long projectId,
                                         Authentication authentication) {
        return evaluationService.getMine(authentication.getName(), projectId);
    }

    @GetMapping("/evaluations/{evaluationId}")
    public EvaluationResponse get(@PathVariable("evaluationId") Long evaluationId,
                                  Authentication authentication) {
        return evaluationService.getOne(authentication.getName(), evaluationId);
    }

    @PostMapping("/evaluations")
    public ResponseEntity<EvaluationResponse> create(@Valid @RequestBody CreateEvaluationRequest request,
                                                     Authentication authentication) {
        EvaluationResponse created = evaluationService.create(authentication.getName(), request);
        return ResponseEntity.created(URI.create("/api/student/evaluations/" + created.id())).body(created);
    }

    @PutMapping("/evaluations/{evaluationId}")
    public EvaluationResponse update(@PathVariable("evaluationId") Long evaluationId,
                                     @Valid @RequestBody UpdateEvaluationRequest request,
                                     Authentication authentication) {
        return evaluationService.update(authentication.getName(), evaluationId, request);
    }
}