package com.peery.app.service;

import com.peery.app.dto.AddMemberRequest;
import com.peery.app.dto.StudentSummaryResponse;
import com.peery.app.dto.TeamRequest;
import com.peery.app.dto.TeamResponse;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.TeamEntity;
import com.peery.app.entity.TeamMemberEntity;
import com.peery.app.entity.UserEntity;
import com.peery.app.exception.ApiException;
import com.peery.app.repository.TeamMemberRepository;
import com.peery.app.repository.TeamRepository;
import com.peery.app.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private final ProjectService projectService;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public TeamService(ProjectService projectService,
                       TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       UserRepository userRepository) {
        this.projectService = projectService;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TeamResponse createTeam(String email, Long projectId, TeamRequest request) {
        ProjectEntity project = projectService.getOwnedProject(email, projectId);
        String name = request.name().trim();

        if (teamRepository.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            throw teamNameTaken();
        }

        TeamEntity team;
        try {
            team = teamRepository.saveAndFlush(new TeamEntity(project, name));
        } catch (DataIntegrityViolationException ex) {
            // Two simultaneous requests: the unique index is the final guard.
            throw teamNameTaken();
        }
        return new TeamResponse(team.getId(), team.getName(), List.of());
    }

    @Transactional
    public void deleteTeam(String email, Long projectId, Long teamId) {
        projectService.getOwnedProject(email, projectId);
        TeamEntity team = findTeam(projectId, teamId);
        teamRepository.delete(team); // cascades to members; those students become unassigned
    }

    @Transactional
    public TeamResponse addMember(String email, Long projectId, Long teamId, AddMemberRequest request) {
        projectService.getOwnedProject(email, projectId);
        TeamEntity team = findTeam(projectId, teamId);

        UserEntity student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND", "Student not found"));

        if (student.getRole() != RoleEntity.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOT_A_STUDENT",
                    "Only student accounts can be added to a team");
        }

        if (teamMemberRepository.existsByProjectIdAndStudentId(projectId, student.getId())) {
            throw studentAlreadyAssigned();
        }

        try {
            teamMemberRepository.saveAndFlush(new TeamMemberEntity(team, student));
        } catch (DataIntegrityViolationException ex) {
            throw studentAlreadyAssigned();
        }

        return buildTeamResponse(team);
    }

    @Transactional
    public void removeMember(String email, Long projectId, Long teamId, Long studentId) {
        projectService.getOwnedProject(email, projectId);
        findTeam(projectId, teamId);

        TeamMemberEntity member = teamMemberRepository.findByTeamIdAndStudentId(teamId, studentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "This student is not in the team"));
        teamMemberRepository.delete(member);
    }

    private TeamEntity findTeam(Long projectId, Long teamId) {
        return teamRepository.findByIdAndProjectId(teamId, projectId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND", "Team not found"));
    }

    private TeamResponse buildTeamResponse(TeamEntity team) {
        List<StudentSummaryResponse> members =
                teamMemberRepository.findByTeamIdWithStudent(team.getId()).stream()
                        .map(m -> StudentSummaryResponse.from(m.getStudent()))
                        .toList();
        return new TeamResponse(team.getId(), team.getName(), members);
    }

    private static ApiException teamNameTaken() {
        return new ApiException(HttpStatus.CONFLICT, "TEAM_NAME_TAKEN",
                "A team with this name already exists in the project");
    }

    private static ApiException studentAlreadyAssigned() {
        return new ApiException(HttpStatus.CONFLICT, "STUDENT_ALREADY_ASSIGNED",
                "This student is already on a team in this project");
    }
}