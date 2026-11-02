package com.peery.app.repository;

import com.peery.app.dto.ProjectCountRow;
import com.peery.app.entity.TeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<TeamEntity, Long> {

    List<TeamEntity> findByProjectIdOrderByNameAsc(Long projectId);

    Optional<TeamEntity> findByIdAndProjectId(Long id, Long projectId);

    boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);

    long countByProjectId(Long projectId);

    @Query("select new com.peery.app.dto.ProjectCountRow(t.project.id, count(t)) "
            + "from TeamEntity t where t.project.id in :projectIds group by t.project.id")
    List<ProjectCountRow> countByProjectIds(@Param("projectIds") Collection<Long> projectIds);
}