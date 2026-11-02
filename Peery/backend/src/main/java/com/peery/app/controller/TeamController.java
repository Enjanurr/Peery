package com.peery.app.controller;

import com.peery.app.dto.AddMemberRequest;
import com.peery.app.dto.TeamRequest;
import com.peery.app.dto.TeamResponse;
import com.peery.app.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Instructor-only (guarded by /api/instructor/** in SecurityConfig). */
@RestController
@RequestMapping("/api/instructor/projects/{projectId}/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(@PathVariable("projectId") Long projectId,
                                                   @Valid @RequestBody TeamRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teamService.createTeam(authentication.getName(), projectId, request));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable("projectId") Long projectId,
                                           @PathVariable("teamId") Long teamId,
                                           Authentication authentication) {
        teamService.deleteTeam(authentication.getName(), projectId, teamId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<TeamResponse> addMember(@PathVariable("projectId") Long projectId,
                                                  @PathVariable("teamId") Long teamId,
                                                  @Valid @RequestBody AddMemberRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teamService.addMember(authentication.getName(), projectId, teamId, request));
    }

    @DeleteMapping("/{teamId}/members/{studentId}")
    public ResponseEntity<Void> removeMember(@PathVariable("projectId") Long projectId,
                                             @PathVariable("teamId") Long teamId,
                                             @PathVariable("studentId") Long studentId,
                                             Authentication authentication) {
        teamService.removeMember(authentication.getName(), projectId, teamId, studentId);
        return ResponseEntity.noContent().build();
    }
}