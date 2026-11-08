package com.peery.app.controller;

import com.peery.app.dto.GradeOverrideResponse;
import com.peery.app.dto.GradebookResponse;
import com.peery.app.dto.OverrideRequest;
import com.peery.app.dto.RevokeRequest;
import com.peery.app.service.GradeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/instructor")
public class InstructorGradeController {

    private final GradeService gradeService;

    public InstructorGradeController(GradeService gradeService) {
        this.gradeService = gradeService;
    }

    @GetMapping("/projects/{projectId}/grades")
    public GradebookResponse gradebook(@PathVariable("projectId") Long projectId,
                                       Authentication authentication) {
        return gradeService.getGradebook(authentication.getName(), projectId);
    }

    @PutMapping("/projects/{projectId}/students/{studentId}/override")
    public GradeOverrideResponse setOverride(@PathVariable("projectId") Long projectId,
                                             @PathVariable("studentId") Long studentId,
                                             @Valid @RequestBody OverrideRequest request,
                                             Authentication authentication) {
        return gradeService.setOverride(authentication.getName(), projectId, studentId, request);
    }

    @PostMapping("/projects/{projectId}/students/{studentId}/override/revoke")
    public GradeOverrideResponse revokeOverride(@PathVariable("projectId") Long projectId,
                                                @PathVariable("studentId") Long studentId,
                                                @Valid @RequestBody RevokeRequest request,
                                                Authentication authentication) {
        return gradeService.revokeOverride(authentication.getName(), projectId, studentId, request);
    }

    @GetMapping("/projects/{projectId}/students/{studentId}/override/history")
    public List<GradeOverrideResponse> history(@PathVariable("projectId") Long projectId,
                                               @PathVariable("studentId") Long studentId,
                                               Authentication authentication) {
        return gradeService.getHistory(authentication.getName(), projectId, studentId);
    }
}