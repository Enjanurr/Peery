package com.peery.app.controller;

import com.peery.app.dto.ProjectDetailResponse;
import com.peery.app.dto.ProjectRequest;
import com.peery.app.dto.ProjectResponse;
import com.peery.app.dto.StudentSummaryResponse;
import com.peery.app.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Instructor-only (guarded by /api/instructor/** in SecurityConfig). */
@RestController
@RequestMapping("/api/instructor")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public List<ProjectResponse> list(Authentication authentication) {
        return projectService.list(authentication.getName());
    }

    @PostMapping("/projects")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(authentication.getName(), request));
    }

    @GetMapping("/projects/{projectId}")
    public ProjectDetailResponse get(@PathVariable("projectId") Long projectId,
                                     Authentication authentication) {
        return projectService.get(authentication.getName(), projectId);
    }

    @PutMapping("/projects/{projectId}")
    public ProjectResponse update(@PathVariable("projectId") Long projectId,
                                  @Valid @RequestBody ProjectRequest request,
                                  Authentication authentication) {
        return projectService.update(authentication.getName(), projectId, request);
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable("projectId") Long projectId,
                                       Authentication authentication) {
        projectService.delete(authentication.getName(), projectId);
        return ResponseEntity.noContent().build();
    }

    /** Roster used by the team-assignment dropdown. */
    @GetMapping("/students")
    public List<StudentSummaryResponse> listStudents() {
        return projectService.listStudents();
    }
}