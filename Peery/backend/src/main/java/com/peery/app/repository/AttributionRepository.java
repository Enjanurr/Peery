package com.peery.app.repository;

import com.peery.app.entity.EvaluationEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** Instructor-only read access that includes evaluator identity. Never used by a student endpoint. */
public interface AttributionRepository extends Repository<EvaluationEntity, Long> {

    @Query("select distinct e from EvaluationEntity e "
            + "join fetch e.evaluator join fetch e.evaluatee "
            + "left join fetch e.scores s left join fetch s.criterion "
            + "where e.project.id = :projectId")
    List<EvaluationEntity> findAllWithDetails(@Param("projectId") Long projectId);
}