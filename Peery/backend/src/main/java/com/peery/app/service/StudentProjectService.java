package com.peery.app.service;

import com.peery.app.dto.StudentProjectResponse;
import com.peery.app.dto.StudentSummaryResponse;
import com.peery.app.dto.StudentTeamResponse;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.TeamEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentProjectService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public StudentProjectService(UserRepository userRepository,
                                 TeamMemberRepository teamMemberRepository) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    /** Projects the signed-in student belongs to, soonest deadline first. */
    @Transactional(readOnly = true)
    public List<StudentProjectResponse> listMyProjects(String email) {
        UserEntity student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User no longer exists"));

        List<TeamMemberEntity> mine =
                teamMemberRepository.findByStudentIdWithTeamAndProject(student.getId());
        if (mine.isEmpty()) {
            return List.of();
        }

        Set<Long> teamIds = mine.stream().map(m -> m.getTeam().getId()).collect(Collectors.toSet());

        // Teammates only (never the caller). Names and emails of teammates are visible;
        // no evaluation data exists in this phase.
        Map<Long, List<StudentSummaryResponse>> teammatesByTeam = new HashMap<>();
        for (TeamMemberEntity member : teamMemberRepository.findByTeamIdsWithStudent(teamIds)) {
            if (member.getStudent().getId().equals(student.getId())) {
                continue;
            }
            teammatesByTeam
                    .computeIfAbsent(member.getTeam().getId(), k -> new ArrayList<>())
                    .add(StudentSummaryResponse.from(member.getStudent()));
        }

        return mine.stream()
                .sorted(Comparator.comparing(m -> m.getTeam().getProject().getEvalEndDate()))
                .map(m -> {
                    TeamEntity team = m.getTeam();
                    ProjectEntity project = team.getProject();
                    return new StudentProjectResponse(
                            project.getId(),
                            project.getTitle(),
                            project.getDescription(),
                            project.getEvalStartDate(),
                            project.getEvalEndDate(),
                            new StudentTeamResponse(
                                    team.getId(),
                                    team.getName(),
                                    teammatesByTeam.getOrDefault(team.getId(), List.of())));
                })
                .toList();
    }
}