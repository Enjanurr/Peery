package com.peery.app.repository;

import com.peery.app.dto.ProjectCountRow;
import com.peery.app.entity.TeamMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMemberEntity, Long> {

    boolean existsByProjectIdAndStudentId(Long projectId, Long studentId);

    long countByProjectId(Long projectId);

    Optional<TeamMemberEntity> findByTeamIdAndStudentId(Long teamId, Long studentId);

    @Query("select m from TeamMemberEntity m join fetch m.student s "
            + "where m.projectId = :projectId order by s.fullName")
    List<TeamMemberEntity> findByProjectIdWithStudent(@Param("projectId") Long projectId);

    @Query("select m from TeamMemberEntity m join fetch m.student s "
            + "where m.team.id = :teamId order by s.fullName")
    List<TeamMemberEntity> findByTeamIdWithStudent(@Param("teamId") Long teamId);

    @Query("select m from TeamMemberEntity m join fetch m.student s "
            + "where m.team.id in :teamIds order by s.fullName")
    List<TeamMemberEntity> findByTeamIdsWithStudent(@Param("teamIds") Collection<Long> teamIds);

    @Query("select m from TeamMemberEntity m join fetch m.team t join fetch t.project "
            + "where m.student.id = :studentId")
    List<TeamMemberEntity> findByStudentIdWithTeamAndProject(@Param("studentId") Long studentId);

    @Query("select new com.peery.app.dto.ProjectCountRow(m.projectId, count(m)) "
            + "from TeamMemberEntity m where m.projectId in :projectIds group by m.projectId")
    List<ProjectCountRow> countByProjectIds(@Param("projectIds") Collection<Long> projectIds);
}