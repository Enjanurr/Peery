package com.peery.app.repository;

import com.peery.app.entity.CriterionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CriterionRepository extends JpaRepository<CriterionEntity, Long> {

    boolean existsByProjectId(Long projectId);

    List<CriterionEntity> findByProjectIdOrderByDisplayOrderAscIdAsc(Long projectId);

    /** Race-safe seeding: concurrent callers cannot create duplicates or throw. */
    @Modifying
    @Query(value = "INSERT INTO criteria (project_id, name, description, min_score, max_score, display_order) "
            + "VALUES (:projectId, :name, :description, 1, 5, :displayOrder) "
            + "ON CONFLICT (project_id, name) DO NOTHING", nativeQuery = true)
    int insertIfAbsent(@Param("projectId") Long projectId,
                       @Param("name") String name,
                       @Param("description") String description,
                       @Param("displayOrder") int displayOrder);
}