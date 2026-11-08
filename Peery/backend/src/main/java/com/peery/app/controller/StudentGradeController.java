package com.peery.app.controller;

import com.peery.app.dto.StudentGradeResponse;
import com.peery.app.service.GradeService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentGradeController {

    private final GradeService gradeService;

    public StudentGradeController(GradeService gradeService) {
        this.gradeService = gradeService;
    }

    @GetMapping("/projects/{projectId}/grade")
    public StudentGradeResponse myGrade(@PathVariable("projectId") Long projectId,
                                        Authentication authentication) {
        return gradeService.getStudentGrade(authentication.getName(), projectId);
    }
}