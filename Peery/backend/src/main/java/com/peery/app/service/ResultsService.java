package com.peery.app.service;

import com.peery.app.dto.CommentRow;
import com.peery.app.dto.CountRow;
import com.peery.app.dto.CriterionAverageRow;
import com.peery.app.dto.EvaluationState;
import com.peery.app.dto.MemberResultResponse;
import com.peery.app.dto.ProjectResultsResponse;
import com.peery.app.dto.ResultsVisibility;
import com.peery.app.dto.StudentResultSummaryDTO;
import com.peery.app.dto.TeamResultsResponse;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.TeamEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.CriterionRepository;
import com.peery.app.repository.ProjectRepository;
import com.peery.app.repository.ResultsRepository;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ResultsService {

    /** Everything needed to aggregate one project, loaded in a handful of queries. */
    private record ProjectData(
            List<ScoreAggregator.CriterionInfo> criteria,
            Map<Long, Map<Long, Double>> averages,
            Map<Long, Long> received,
            Map<Long, Long> given,
            Map<Long, List<String>> comments) {

        long receivedBy(Long userId) {
            return received.getOrDefault(userId, 0L);
        }

        long givenBy(Long userId) {
            return given.getOrDefault(userId, 0L);
        }

        Map<Long, Double> averagesFor(Long userId) {
            return averages.getOrDefault(userId, Map.of());
        }

        List<String> commentsFor(Long userId) {
            return comments.getOrDefault(userId, List.of());
        }
    }

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final CriterionRepository criterionRepository;
    private final ResultsRepository resultsRepository;
    private final EvaluationWindowPolicy windowPolicy;
    private final ProjectService projectService;
    private final ScoreAggregator aggregator;
    private final int minResponses;

    public ResultsService(UserRepository userRepository,
                          ProjectRepository projectRepository,
                          TeamMemberRepository teamMemberRepository,
                          CriterionRepository criterionRepository,
                          ResultsRepository resultsRepository,
                          EvaluationWindowPolicy windowPolicy,
                          ProjectService projectService,
                          ScoreAggregator aggregator,
                          @Value("${peery.results.min-responses:2}") int minResponses) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.criterionRepository = criterionRepository;
        this.resultsRepository = resultsRepository;
        this.windowPolicy = windowPolicy;
        this.projectService = projectService;
        this.aggregator = aggregator;
        // With one response the average IS that person's rating, so 2 is the lowest safe value.
        this.minResponses = Math.max(2, minResponses);
    }

    // -------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public StudentResultSummaryDTO getStudentSummary(String email, Long projectId) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
        TeamMemberEntity member = teamMemberRepository.findByProjectIdAndStudentId(projectId, user.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.FORBIDDEN, "NOT_TEAM_MEMBER", "You are not on a team in this project"));

        // Results are released only once the window is closed, so ratings cannot be gamed mid-evaluation.
        if (windowPolicy.stateOf(project) != EvaluationState.CLOSED) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "RESULTS_NOT_AVAILABLE",
                    "Results are released after the evaluation deadline (" + project.getEvalEndDate() + ")");
        }

        String teamName = member.getTeam().getName();
        Long userId = user.getId();
        ProjectData data = load(projectId, false);   // never touches evaluator_id

        long received = data.receivedBy(userId);
        if (received < minResponses) {
            return new StudentResultSummaryDTO(
                    projectId, project.getTitle(), teamName,
                    ResultsVisibility.INSUFFICIENT_RESPONSES,
                    null, null, null,
                    List.of(), List.of(),
                    "Your results stay hidden until at least " + minResponses
                            + " teammates have evaluated you, so that no single rating can be traced to one person.",
                    project.getEvalEndDate());
        }

        ScoreAggregator.Aggregate aggregate = aggregator.aggregate(
                data.criteria(), data.averagesFor(userId), data.commentsFor(userId));

        return new StudentResultSummaryDTO(
                projectId, project.getTitle(), teamName,
                ResultsVisibility.AVAILABLE,
                (int) received,
                aggregate.overallAverage(),
                aggregate.overallPercent(),
                aggregate.criteria(),
                aggregate.comments(),
                null,
                project.getEvalEndDate());
    }

    // ----------------------------------------------------------- instructor

    @Transactional(readOnly = true)
    public ProjectResultsResponse getProjectResults(String email, Long projectId) {
        ProjectEntity project = projectService.getOwnedProject(email, projectId);
        ProjectData data = load(projectId, true);

        Map<Long, List<TeamMemberEntity>> membersByTeam = new LinkedHashMap<>();
        for (TeamMemberEntity member : teamMemberRepository.findByProjectIdWithTeamAndStudent(projectId)) {
            membersByTeam.computeIfAbsent(member.getTeam().getId(), id -> new ArrayList<>()).add(member);
        }

        List<TeamResultsResponse> teams = new ArrayList<>();
        for (List<TeamMemberEntity> members : membersByTeam.values()) {
            int memberCount = members.size();
            long expectedPerMember = memberCount - 1L;
            long submitted = 0;
            List<MemberResultResponse> memberResults = new ArrayList<>();

            for (TeamMemberEntity member : members) {
                Long studentId = member.getStudent().getId();
                long given = data.givenBy(studentId);
                submitted += given;

                ScoreAggregator.Aggregate aggregate = aggregator.aggregate(
                        data.criteria(), data.averagesFor(studentId), data.commentsFor(studentId));

                memberResults.add(new MemberResultResponse(
                        studentId,
                        member.getStudent().getFullName(),
                        data.receivedBy(studentId),
                        given,
                        expectedPerMember,
                        aggregate.overallAverage(),
                        aggregate.overallPercent(),
                        aggregate.criteria(),
                        aggregate.comments()));
            }

            TeamEntity team = members.get(0).getTeam();
            teams.add(new TeamResultsResponse(
                    team.getId(), team.getName(), memberCount,
                    submitted, memberCount * expectedPerMember, memberResults));
        }

        return new ProjectResultsResponse(
                projectId, project.getTitle(), windowPolicy.stateOf(project), project.getEvalEndDate(), teams);
    }

    // -------------------------------------------------------------- helpers

    private ProjectData load(Long projectId, boolean withGivenCounts) {
        List<ScoreAggregator.CriterionInfo> criteria =
                criterionRepository.findByProjectIdOrderByDisplayOrderAscIdAsc(projectId).stream()
                        .map(c -> new ScoreAggregator.CriterionInfo(
                                c.getId(), c.getName(), c.getMinScore(), c.getMaxScore()))
                        .toList();

        Map<Long, Map<Long, Double>> averages = new HashMap<>();
        for (CriterionAverageRow row : resultsRepository.averagesByEvaluatee(projectId)) {
            averages.computeIfAbsent(row.evaluateeId(), id -> new HashMap<>())
                    .put(row.criterionId(), row.average());
        }

        Map<Long, List<String>> comments = new HashMap<>();
        for (CommentRow row : resultsRepository.comments(projectId)) {
            comments.computeIfAbsent(row.evaluateeId(), id -> new ArrayList<>()).add(row.comment());
        }

        Map<Long, Long> given = withGivenCounts
                ? toMap(resultsRepository.givenCounts(projectId))
                : Map.of();

        return new ProjectData(criteria, averages, toMap(resultsRepository.receivedCounts(projectId)),
                given, comments);
    }

    private static Map<Long, Long> toMap(List<CountRow> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (CountRow row : rows) {
            map.put(row.userId(), row.count());
        }
        return map;
    }
}