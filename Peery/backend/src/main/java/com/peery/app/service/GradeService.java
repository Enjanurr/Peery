package com.peery.app.service;

import com.peery.app.dto.EvaluationState;
import com.peery.app.dto.GradeOverrideResponse;
import com.peery.app.dto.GradebookResponse;
import com.peery.app.dto.GradebookRowResponse;
import com.peery.app.dto.MemberResultResponse;
import com.peery.app.dto.OverrideRequest;
import com.peery.app.dto.ProjectResultsResponse;
import com.peery.app.dto.ResultsVisibility;
import com.peery.app.dto.RevokeRequest;
import com.peery.app.dto.StudentGradeResponse;
import com.peery.app.dto.StudentResultSummaryDTO;
import com.peery.app.dto.TeamResultsResponse;
import com.peery.app.entity.GradeOverrideEntity;
import com.peery.app.entity.OverrideAction;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.GradeOverrideRepository;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GradeService {

    private static final Logger log = LoggerFactory.getLogger(GradeService.class);
    private static final int REASON_MIN = 10;

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final GradeOverrideRepository overrideRepository;
    private final ProjectService projectService;
    private final ResultsService resultsService;
    private final EvaluationWindowPolicy windowPolicy;

    public GradeService(UserRepository userRepository,
                        TeamMemberRepository teamMemberRepository,
                        GradeOverrideRepository overrideRepository,
                        ProjectService projectService,
                        ResultsService resultsService,
                        EvaluationWindowPolicy windowPolicy) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.overrideRepository = overrideRepository;
        this.projectService = projectService;
        this.resultsService = resultsService;
        this.windowPolicy = windowPolicy;
    }

    // ----------------------------------------------------------- instructor

    @Transactional(readOnly = true)
    public GradebookResponse getGradebook(String email, Long projectId) {
        ProjectResultsResponse results = resultsService.getProjectResults(email, projectId);

        Map<Long, GradeOverrideEntity> latest = new HashMap<>();
        for (GradeOverrideEntity row : overrideRepository.findLatestPerStudent(projectId)) {
            latest.put(row.getStudent().getId(), row);
        }

        List<GradebookRowResponse> rows = new ArrayList<>();
        for (TeamResultsResponse team : results.teams()) {
            for (MemberResultResponse member : team.members()) {
                GradeOverrideEntity current = latest.get(member.studentId());
                boolean overridden = current != null && current.getAction() == OverrideAction.SET;
                Double override = overridden ? current.getOverridePercent().doubleValue() : null;

                rows.add(new GradebookRowResponse(
                        member.studentId(),
                        member.fullName(),
                        team.teamName(),
                        member.overallPercent(),
                        override,
                        overridden ? override : member.overallPercent(),
                        overridden,
                        overridden ? current.getCreatedAt() : null,
                        overridden ? current.getReason() : null));
            }
        }
        return new GradebookResponse(projectId, results.projectTitle(), results.evaluationState(), rows);
    }

    @Transactional
    public GradeOverrideResponse setOverride(String email, Long projectId, Long studentId, OverrideRequest request) {
        UserEntity instructor = currentUser(email);
        ProjectEntity project = requireClosedOwnedProject(email, projectId);
        TeamMemberEntity membership = requireMembership(projectId, studentId);
        String reason = cleanReason(request.reason());

        GradeOverrideEntity saved = overrideRepository.save(new GradeOverrideEntity(
                project,
                membership.getStudent(),
                instructor,
                OverrideAction.SET,
                request.overridePercent().setScale(2, RoundingMode.HALF_UP),
                toDecimal(computedPercentOf(email, projectId, studentId)),
                reason,
                windowPolicy.now()));

        log.info("Grade override SET: instructor={} projectId={} studentId={} percent={}",
                email, projectId, studentId, saved.getOverridePercent());
        return toResponse(saved);
    }

    @Transactional
    public GradeOverrideResponse revokeOverride(String email, Long projectId, Long studentId, RevokeRequest request) {
        UserEntity instructor = currentUser(email);
        ProjectEntity project = requireClosedOwnedProject(email, projectId);
        TeamMemberEntity membership = requireMembership(projectId, studentId);
        String reason = cleanReason(request.reason());

        overrideRepository.findFirstByProjectIdAndStudentIdOrderByIdDesc(projectId, studentId)
                .filter(row -> row.getAction() == OverrideAction.SET)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "NO_ACTIVE_OVERRIDE",
                        "This student has no active override to revoke"));

        GradeOverrideEntity saved = overrideRepository.save(new GradeOverrideEntity(
                project,
                membership.getStudent(),
                instructor,
                OverrideAction.REVOKE,
                null,
                toDecimal(computedPercentOf(email, projectId, studentId)),
                reason,
                windowPolicy.now()));

        log.info("Grade override REVOKE: instructor={} projectId={} studentId={}", email, projectId, studentId);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GradeOverrideResponse> getHistory(String email, Long projectId, Long studentId) {
        projectService.getOwnedProject(email, projectId);
        requireMembership(projectId, studentId);
        return overrideRepository.findHistory(projectId, studentId).stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public StudentGradeResponse getStudentGrade(String email, Long projectId) {
        // Reuses Phase 4's gates (404 project, 403 not on a team, 422 not yet released)
        // and its anonymity decision about whether the computed score may be shown.
        StudentResultSummaryDTO summary = resultsService.getStudentSummary(email, projectId);
        UserEntity student = currentUser(email);

        Optional<GradeOverrideEntity> latest = overrideRepository
                .findFirstByProjectIdAndStudentIdOrderByIdDesc(projectId, student.getId());
        boolean adjusted = latest.isPresent() && latest.get().getAction() == OverrideAction.SET;

        Double computed = summary.visibility() == ResultsVisibility.AVAILABLE ? summary.overallPercent() : null;
        Double finalPercent = adjusted ? latest.get().getOverridePercent().doubleValue() : computed;

        return new StudentGradeResponse(
                projectId,
                computed,
                finalPercent,
                adjusted,
                adjusted ? latest.get().getCreatedAt() : null);
    }

    // -------------------------------------------------------------- helpers

    private UserEntity currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));
    }

    private ProjectEntity requireClosedOwnedProject(String email, Long projectId) {
        ProjectEntity project = projectService.getOwnedProject(email, projectId);
        if (windowPolicy.stateOf(project) != EvaluationState.CLOSED) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "EVALUATION_NOT_CLOSED",
                    "Grades can only be overridden after the evaluation deadline ("
                            + project.getEvalEndDate() + ")");
        }
        return project;
    }

    private TeamMemberEntity requireMembership(Long projectId, Long studentId) {
        return teamMemberRepository.findByProjectIdAndStudentId(projectId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STUDENT_NOT_IN_PROJECT",
                        "That student is not on a team in this project"));
    }

    /** Bean validation checks the raw length; this rejects reasons that are mostly whitespace. */
    private static String cleanReason(String reason) {
        String trimmed = reason == null ? "" : reason.trim();
        if (trimmed.length() < REASON_MIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REASON_TOO_SHORT",
                    "A reason of at least " + REASON_MIN + " characters is required");
        }
        return trimmed;
    }

    /** The Phase 4 computed percent for one student, or null when nothing has been scored. */
    private Double computedPercentOf(String email, Long projectId, Long studentId) {
        for (TeamResultsResponse team : resultsService.getProjectResults(email, projectId).teams()) {
            for (MemberResultResponse member : team.members()) {
                if (member.studentId().equals(studentId)) {
                    return member.overallPercent();
                }
            }
        }
        return null;
    }

    private static BigDecimal toDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private GradeOverrideResponse toResponse(GradeOverrideEntity o) {
        return new GradeOverrideResponse(
                o.getId(),
                o.getStudent().getId(),
                o.getStudent().getFullName(),
                o.getAction(),
                o.getOverridePercent() == null ? null : o.getOverridePercent().doubleValue(),
                o.getComputedPercent() == null ? null : o.getComputedPercent().doubleValue(),
                o.getReason(),
                o.getInstructor().getId(),
                o.getInstructor().getFullName(),
                o.getCreatedAt());
    }
}