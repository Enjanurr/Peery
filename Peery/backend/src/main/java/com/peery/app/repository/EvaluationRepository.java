package com.peery.app.repository;

import com.peery.app.entity.EvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<EvaluationEntity, Long> {

    boolean existsByProjectIdAndEvaluatorIdAndEvaluateeId(Long projectId, Long evaluatorId, Long evaluateeId);

    List<EvaluationEntity> findByProjectIdAndEvaluatorId(Long projectId, Long evaluatorId);

    /** Loads an evaluation only if the caller wrote it; anyone else's id looks like "not found". */
    @Query("select distinct e from EvaluationEntity e "
            + "join fetch e.project join fetch e.evaluatee "
            + "left join fetch e.scores s left join fetch s.criterion "
            + "where e.id = :id and e.evaluator.id = :evaluatorId")
    Optional<EvaluationEntity> findOwnedWithDetails(@Param("id") Long id,
                                                    @Param("evaluatorId") Long evaluatorId);

    @Query("select distinct e from EvaluationEntity e "
            + "join fetch e.project join fetch e.evaluatee "
            + "left join fetch e.scores s left join fetch s.criterion "
            + "where e.project.id = :projectId and e.evaluator.id = :evaluatorId")
    List<EvaluationEntity> findMineWithDetails(@Param("projectId") Long projectId,
                                               @Param("evaluatorId") Long evaluatorId);
}