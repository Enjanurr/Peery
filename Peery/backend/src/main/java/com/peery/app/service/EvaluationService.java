package com.peery.app.service;

import com.peery.app.dto.CreateEvaluationRequest;
import com.peery.app.dto.CriterionResponse;
import com.peery.app.dto.EvaluationResponse;
import com.peery.app.dto.EvaluationState;
import com.peery.app.dto.EvaluationStatus;
import com.peery.app.dto.EvaluationWindowResponse;
import com.peery.app.dto.PendingEvaluationsResponse;
import com.peery.app.dto.PendingTeammateResponse;
import com.peery.app.dto.ScoreInput;
import com.peery.app.dto.ScoreResponse;
import com.peery.app.dto.UpdateEvaluationRequest;
import com.peery.app.entity.CriterionEntity;
import com.peery.app.entity.EvaluationEntity;
import com.peery.app.entity.EvaluationScoreEntity;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.EvaluationRepository;
import com.peery.app.repository.ProjectRepository;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EvaluationService {

    /** The signed-in student, the project, and their team membership in it. */
    private record Membership(UserEntity user, ProjectEntity project, TeamMemberEntity member) {
    }

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EvaluationRepository evaluationRepository;
    private final CriterionService criterionService;
    private final EvaluationWindowPolicy windowPolicy;

    public EvaluationService(UserRepository userRepository,
                             ProjectRepository projectRepository,
                             TeamMemberRepository teamMemberRepository,
                             EvaluationRepository evaluationRepository,
                             CriterionService criterionService,
                             EvaluationWindowPolicy windowPolicy) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.evaluationRepository = evaluationRepository;
        this.criterionService = criterionService;
        this.windowPolicy = windowPolicy;
    }

    // ---------------------------------------------------------------- reads

    @Transactional(readOnly = true)
    public EvaluationWindowResponse getWindow(String email, Long projectId) {
        Membership me = requireMembership(email, projectId);
        ProjectEntity project = me.project();
        return new EvaluationWindowResponse(
                project.getId(),
                project.getEvalStartDate(),
                project.getEvalEndDate(),
                windowPolicy.stateOf(project),
                windowPolicy.now());
    }

    /** Not read-only: the first read of a project's rubric seeds the defaults. */
    @Transactional
    public List<CriterionResponse> getCriteria(String email, Long projectId) {
        Membership me = requireMembership(email, projectId);
        return criterionService.getOrSeed(me.project().getId()).stream()
                .map(c -> new CriterionResponse(
                        c.getId(), c.getName(), c.getDescription(), c.getMinScore(), c.getMaxScore()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PendingEvaluationsResponse getPending(String email, Long projectId) {
        Membership me = requireMembership(email, projectId);
        Long myId = me.user().getId();
        Long teamId = me.member().getTeam().getId();

        Map<Long, Long> evaluationIdByEvaluatee = new HashMap<>();
        for (EvaluationEntity evaluation : evaluationRepository.findByProjectIdAndEvaluatorId(projectId, myId)) {
            evaluationIdByEvaluatee.put(evaluation.getEvaluatee().getId(), evaluation.getId());
        }

        List<PendingTeammateResponse> teammates = teamMemberRepository.findByTeamIdWithStudent(teamId).stream()
                .filter(m -> !m.getStudent().getId().equals(myId))
                .map(m -> {
                    Long evaluationId = evaluationIdByEvaluatee.get(m.getStudent().getId());
                    return new PendingTeammateResponse(
                            m.getStudent().getId(),
                            m.getStudent().getFullName(),
                            evaluationId == null ? EvaluationStatus.NOT_STARTED : EvaluationStatus.SUBMITTED,
                            evaluationId);
                })
                .toList();

        long completed = teammates.stream().filter(t -> t.status() == EvaluationStatus.SUBMITTED).count();
        return new PendingEvaluationsResponse(projectId, completed, teammates.size(), teammates);
    }

    /** Evaluations the caller has GIVEN. There is intentionally no way to list evaluations received. */
    @Transactional(readOnly = true)
    public List<EvaluationResponse> getMine(String email, Long projectId) {
        Membership me = requireMembership(email, projectId);
        boolean editable = windowPolicy.stateOf(me.project()) == EvaluationState.OPEN;

        return evaluationRepository.findMineWithDetails(projectId, me.user().getId()).stream()
                .sorted(Comparator.comparing(e -> e.getEvaluatee().getFullName()))
                .map(e -> toResponse(e, editable))
                .toList();
    }

    @Transactional(readOnly = true)
    public EvaluationResponse getOne(String email, Long evaluationId) {
        UserEntity user = currentUser(email);
        EvaluationEntity evaluation = evaluationRepository.findOwnedWithDetails(evaluationId, user.getId())
                .orElseThrow(EvaluationService::evaluationNotFound);
        boolean editable = windowPolicy.stateOf(evaluation.getProject()) == EvaluationState.OPEN;
        return toResponse(evaluation, editable);
    }

    // --------------------------------------------------------------- writes

    @Transactional
    public EvaluationResponse create(String email, CreateEvaluationRequest request) {
        Membership me = requireMembership(email, request.projectId());
        Long myId = me.user().getId();

        if (request.evaluateeId().equals(myId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_EVALUATION", "You cannot evaluate yourself");
        }
        UserEntity evaluatee = requireTeammate(me, request.evaluateeId());

        windowPolicy.assertOpen(me.project());

        List<CriterionEntity> criteria = criterionService.getOrSeed(me.project().getId());
        validateScores(criteria, request.scores());

        if (evaluationRepository.existsByProjectIdAndEvaluatorIdAndEvaluateeId(
                me.project().getId(), myId, evaluatee.getId())) {
            throw duplicate();
        }

        EvaluationEntity evaluation = new EvaluationEntity(
                me.project(), me.user(), evaluatee, cleanComment(request.comment()), windowPolicy.now());
        applyScores(evaluation, criteria, request.scores());

        try {
            evaluation = evaluationRepository.saveAndFlush(evaluation);
        } catch (DataIntegrityViolationException ex) {
            // Two simultaneous submits: the unique constraint is the final guard.
            throw duplicate();
        }
        return toResponse(evaluation, true);
    }

    @Transactional
    public EvaluationResponse update(String email, Long evaluationId, UpdateEvaluationRequest request) {
        UserEntity user = currentUser(email);
        EvaluationEntity evaluation = evaluationRepository.findOwnedWithDetails(evaluationId, user.getId())
                .orElseThrow(EvaluationService::evaluationNotFound);
        ProjectEntity project = evaluation.getProject();

        // The author must still be on the same team as the person they rated.
        Membership me = requireMembership(email, project.getId());
        requireTeammate(me, evaluation.getEvaluatee().getId());

        windowPolicy.assertOpen(project);

        if (!request.version().equals(evaluation.getVersion())) {
            throw staleVersion();
        }

        List<CriterionEntity> criteria = criterionService.getOrSeed(project.getId());
        validateScores(criteria, request.scores());
        applyScores(evaluation, criteria, request.scores());
        evaluation.update(cleanComment(request.comment()), windowPolicy.now());

        // A concurrent edit surfaces as an optimistic-lock failure, which the global handler maps to 409.
        evaluation = evaluationRepository.saveAndFlush(evaluation);
        return toResponse(evaluation, true);
    }

    // -------------------------------------------------------------- helpers

    private UserEntity currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));
    }

    private Membership requireMembership(String email, Long projectId) {
        UserEntity user = currentUser(email);
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
        TeamMemberEntity member = teamMemberRepository.findByProjectIdAndStudentId(projectId, user.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.FORBIDDEN, "NOT_TEAM_MEMBER", "You are not on a team in this project"));
        return new Membership(user, project, member);
    }

    /** The other person must be on the caller's own team. An unknown id gets the same answer. */
    private UserEntity requireTeammate(Membership me, Long otherUserId) {
        Long myTeamId = me.member().getTeam().getId();
        return teamMemberRepository.findByProjectIdAndStudentId(me.project().getId(), otherUserId)
                .filter(m -> m.getTeam().getId().equals(myTeamId))
                .map(TeamMemberEntity::getStudent)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.FORBIDDEN, "NOT_A_TEAMMATE", "You can only evaluate members of your own team"));
    }

    /** Every criterion exactly once, each within that criterion's own range. */
    private void validateScores(List<CriterionEntity> criteria, List<ScoreInput> inputs) {
        Map<Long, CriterionEntity> byId = criteria.stream()
                .collect(Collectors.toMap(CriterionEntity::getId, c -> c));
        Set<Long> seen = new HashSet<>();

        for (ScoreInput input : inputs) {
            CriterionEntity criterion = byId.get(input.criterionId());
            if (criterion == null) {
                throw invalidScores("Unknown criterion id " + input.criterionId());
            }
            if (!seen.add(criterion.getId())) {
                throw invalidScores(criterion.getName() + " is scored more than once");
            }
            if (input.score() < criterion.getMinScore() || input.score() > criterion.getMaxScore()) {
                throw invalidScores(criterion.getName() + " must be between "
                        + criterion.getMinScore() + " and " + criterion.getMaxScore());
            }
        }

        if (seen.size() != criteria.size()) {
            String missing = criteria.stream()
                    .filter(c -> !seen.contains(c.getId()))
                    .map(CriterionEntity::getName)
                    .collect(Collectors.joining(", "));
            throw invalidScores("Every criterion must be scored. Missing: " + missing);
        }
    }

    /** Updates existing score rows in place and adds rows for any criterion that has none yet. */
    private void applyScores(EvaluationEntity evaluation, List<CriterionEntity> criteria, List<ScoreInput> inputs) {
        Map<Long, CriterionEntity> criteriaById = criteria.stream()
                .collect(Collectors.toMap(CriterionEntity::getId, c -> c));
        Map<Long, EvaluationScoreEntity> existing = evaluation.getScores().stream()
                .collect(Collectors.toMap(s -> s.getCriterion().getId(), s -> s));

        for (ScoreInput input : inputs) {
            EvaluationScoreEntity current = existing.get(input.criterionId());
            if (current != null) {
                current.setScore(input.score());
            } else {
                evaluation.addScore(criteriaById.get(input.criterionId()), input.score());
            }
        }
    }

    private EvaluationResponse toResponse(EvaluationEntity e, boolean editable) {
        List<ScoreResponse> scores = e.getScores().stream()
                .sorted(Comparator
                        .comparingInt((EvaluationScoreEntity s) -> s.getCriterion().getDisplayOrder())
                        .thenComparing(s -> s.getCriterion().getId()))
                .map(s -> new ScoreResponse(s.getCriterion().getId(), s.getCriterion().getName(), s.getScore()))
                .toList();

        return new EvaluationResponse(
                e.getId(),
                e.getProject().getId(),
                e.getEvaluatee().getId(),
                e.getEvaluatee().getFullName(),
                scores,
                e.getComment(),
                e.getSubmittedAt(),
                e.getUpdatedAt(),
                e.getVersion(),
                editable);
    }

    private static String cleanComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static ApiException invalidScores(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SCORES", message);
    }

    private static ApiException duplicate() {
        return new ApiException(HttpStatus.CONFLICT, "DUPLICATE_EVALUATION",
                "You have already evaluated this teammate for this project");
    }

    private static ApiException staleVersion() {
        return new ApiException(HttpStatus.CONFLICT, "STALE_VERSION",
                "This evaluation was changed elsewhere. Reload and try again");
    }

    private static ApiException evaluationNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "EVALUATION_NOT_FOUND", "Evaluation not found");
    }
}