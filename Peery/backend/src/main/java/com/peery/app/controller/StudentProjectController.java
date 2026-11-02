package com.peery.app.controller;

import com.peery.app.dto.StudentProjectResponse;
import com.peery.app.service.StudentProjectService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Student-only (guarded by /api/student/** in SecurityConfig). */
@RestController
@RequestMapping("/api/student")
public class StudentProjectController {

    private final StudentProjectService studentProjectService;

    public StudentProjectController(StudentProjectService studentProjectService) {
        this.studentProjectService = studentProjectService;
    }

    @GetMapping("/projects")
    public List<StudentProjectResponse> myProjects(Authentication authentication) {
        return studentProjectService.listMyProjects(authentication.getName());
    }
}