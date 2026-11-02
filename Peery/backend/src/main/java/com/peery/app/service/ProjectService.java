package com.peery.app.service;

import com.peery.app.dto.ProjectCountRow;
import com.peery.app.dto.ProjectDetailResponse;
import com.peery.app.dto.ProjectRequest;
import com.peery.app.dto.ProjectResponse;
import com.peery.app.dto.StudentSummaryResponse;
import com.peery.app.dto.TeamResponse;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.TeamEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.ProjectRepository;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.TeamRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          TeamRepository teamRepository,
                          TeamMemberRepository teamMemberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(String email) {
        UserEntity instructor = currentUser(email);
        List<ProjectEntity> projects =
                projectRepository.findByInstructorIdOrderByCreatedAtDesc(instructor.getId());
        if (projects.isEmpty()) {
            return List.of();
        }

        List<Long> ids = projects.stream().map(ProjectEntity::getId).toList();
        Map<Long, Long> teamCounts = toMap(teamRepository.countByProjectIds(ids));
        Map<Long, Long> studentCounts = toMap(teamMemberRepository.countByProjectIds(ids));

        return projects.stream()
                .map(p -> toResponse(p,
                        teamCounts.getOrDefault(p.getId(), 0L),
                        studentCounts.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse get(String email, Long projectId) {
        ProjectEntity project = getOwnedProject(email, projectId);

        List<TeamEntity> teams = teamRepository.findByProjectIdOrderByNameAsc(projectId);
        List<TeamMemberEntity> members = teamMemberRepository.findByProjectIdWithStudent(projectId);

        Map<Long, List<StudentSummaryResponse>> membersByTeam = new HashMap<>();
        for (TeamMemberEntity member : members) {
            membersByTeam
                    .computeIfAbsent(member.getTeam().getId(), k -> new ArrayList<>())
                    .add(StudentSummaryResponse.from(member.getStudent()));
        }

        List<TeamResponse> teamResponses = teams.stream()
                .map(t -> new TeamResponse(t.getId(), t.getName(),
                        membersByTeam.getOrDefault(t.getId(), List.of())))
                .toList();

        return new ProjectDetailResponse(
                project.getId(),
                project.getTitle(),
                project.getDescription(),
                project.getEvalStartDate(),
                project.getEvalEndDate(),
                teams.size(),
                members.size(),
                project.getCreatedAt(),
                teamResponses);
    }

    @Transactional
    public ProjectResponse create(String email, ProjectRequest request) {
        UserEntity instructor = currentUser(email);
        validateWindow(request.evalStartDate(), request.evalEndDate());

        ProjectEntity project = new ProjectEntity(
                instructor,
                request.title().trim(),
                blankToNull(request.description()),
                request.evalStartDate(),
                request.evalEndDate());

        return toResponse(projectRepository.save(project), 0, 0);
    }

    @Transactional
    public ProjectResponse update(String email, Long projectId, ProjectRequest request) {
        ProjectEntity project = getOwnedProject(email, projectId);
        validateWindow(request.evalStartDate(), request.evalEndDate());

        project.update(
                request.title().trim(),
                blankToNull(request.description()),
                request.evalStartDate(),
                request.evalEndDate());

        return toResponse(project,
                teamRepository.countByProjectId(projectId),
                teamMemberRepository.countByProjectId(projectId));
    }

    @Transactional
    public void delete(String email, Long projectId) {
        ProjectEntity project = getOwnedProject(email, projectId);
        projectRepository.delete(project); // cascades to teams and members
    }

    @Transactional(readOnly = true)
    public List<StudentSummaryResponse> listStudents() {
        return userRepository.findByRoleOrderByFullNameAsc(RoleEntity.STUDENT).stream()
                .map(StudentSummaryResponse::from)
                .toList();
    }

    /**
     * Loads a project only if it belongs to the signed-in instructor.
     * Someone else's project is reported as 404 so ids cannot be probed.
     */
    @Transactional(readOnly = true)
    public ProjectEntity getOwnedProject(String email, Long projectId) {
        UserEntity instructor = currentUser(email);
        return projectRepository.findByIdAndInstructorId(projectId, instructor.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
    }

    private UserEntity currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));
    }

    private static void validateWindow(Instant start, Instant end) {
        if (!end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE",
                    "Evaluation deadline must be after the start date");
        }
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Map<Long, Long> toMap(List<ProjectCountRow> rows) {
        return rows.stream().collect(Collectors.toMap(ProjectCountRow::projectId, ProjectCountRow::total));
    }

    private static ProjectResponse toResponse(ProjectEntity p, long teamCount, long studentCount) {
        return new ProjectResponse(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                p.getEvalStartDate(),
                p.getEvalEndDate(),
                teamCount,
                studentCount,
                p.getCreatedAt());
    }
}