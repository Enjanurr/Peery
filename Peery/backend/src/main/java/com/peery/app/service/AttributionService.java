package com.peery.app.service;

import com.peery.app.dto.AttributionEvaluationResponse;
import com.peery.app.dto.AttributionResponse;
import com.peery.app.dto.EvaluationState;
import com.peery.app.dto.PersonRef;
import com.peery.app.dto.ScoreResponse;
import com.peery.app.entity.EvaluationEntity;
import com.peery.app.entity.EvaluationScoreEntity;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.AttributionRepository;
import com.peery.app.repository.TeamMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttributionService {

    private static final Logger log = LoggerFactory.getLogger(AttributionService.class);

    private final ProjectService projectService;
    private final EvaluationWindowPolicy windowPolicy;
    private final AttributionRepository attributionRepository;
    private final TeamMemberRepository teamMemberRepository;

    public AttributionService(ProjectService projectService,
                              EvaluationWindowPolicy windowPolicy,
                              AttributionRepository attributionRepository,
                              TeamMemberRepository teamMemberRepository) {
        this.projectService = projectService;
        this.windowPolicy = windowPolicy;
        this.attributionRepository = attributionRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Transactional(readOnly = true)
    public AttributionResponse getAttribution(String email, Long projectId) {
        ProjectEntity project = projectService.getOwnedProject(email, projectId);

        // Rater identities are only revealed once nobody can change their ratings any more.
        if (windowPolicy.stateOf(project) != EvaluationState.CLOSED) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "ATTRIBUTION_NOT_AVAILABLE",
                    "Attribution is available after the evaluation deadline (" + project.getEvalEndDate() + ")");
        }

        Map<Long, String> teamNameByStudent = new HashMap<>();
        for (TeamMemberEntity member : teamMemberRepository.findByProjectIdWithTeamAndStudent(projectId)) {
            teamNameByStudent.put(member.getStudent().getId(), member.getTeam().getName());
        }

        List<AttributionEvaluationResponse> evaluations = attributionRepository.findAllWithDetails(projectId)
                .stream()
                .map(e -> toResponse(e, teamNameByStudent))
                .sorted(Comparator
                        .comparing(AttributionEvaluationResponse::teamName)
                        .thenComparing(e -> e.evaluatee().fullName())
                        .thenComparing(e -> e.evaluator().fullName()))
                .toList();

        // Audit trail: reading attribution is a sensitive action.
        log.info("Attribution viewed: instructor={} projectId={} evaluations={}",
                email, projectId, evaluations.size());

        return new AttributionResponse(projectId, project.getTitle(), EvaluationState.CLOSED, evaluations);
    }

    private static AttributionEvaluationResponse toResponse(EvaluationEntity e, Map<Long, String> teamNames) {
        List<ScoreResponse> scores = e.getScores().stream()
                .sorted(Comparator
                        .comparingInt((EvaluationScoreEntity s) -> s.getCriterion().getDisplayOrder())
                        .thenComparing(s -> s.getCriterion().getId()))
                .map(s -> new ScoreResponse(s.getCriterion().getId(), s.getCriterion().getName(), s.getScore()))
                .toList();

        return new AttributionEvaluationResponse(
                e.getId(),
                teamNames.getOrDefault(e.getEvaluatee().getId(), "(no team)"),
                new PersonRef(e.getEvaluator().getId(), e.getEvaluator().getFullName()),
                new PersonRef(e.getEvaluatee().getId(), e.getEvaluatee().getFullName()),
                scores,
                e.getComment(),
                e.getSubmittedAt(),
                e.getUpdatedAt());
    }
}