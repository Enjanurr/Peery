package com.peery.app.repository;

import com.peery.app.dto.CommentRow;
import com.peery.app.dto.CountRow;
import com.peery.app.dto.CriterionAverageRow;
import com.peery.app.entity.EvaluationEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Read-only aggregate queries. Everything is computed in the database and returned as projections,
 * so no entity graph that contains evaluator data is ever loaded.
 */
public interface ResultsRepository extends Repository<EvaluationEntity, Long> {

    @Query("select new com.peery.app.dto.CriterionAverageRow(e.evaluatee.id, s.criterion.id, avg(s.score)) "
            + "from EvaluationScoreEntity s join s.evaluation e "
            + "where e.project.id = :projectId "
            + "group by e.evaluatee.id, s.criterion.id")
    List<CriterionAverageRow> averagesByEvaluatee(@Param("projectId") Long projectId);

    @Query("select new com.peery.app.dto.CountRow(e.evaluatee.id, count(e)) "
            + "from EvaluationEntity e where e.project.id = :projectId "
            + "group by e.evaluatee.id")
    List<CountRow> receivedCounts(@Param("projectId") Long projectId);

    /** Used by the instructor progress view only. The student endpoint never calls this. */
    @Query("select new com.peery.app.dto.CountRow(e.evaluator.id, count(e)) "
            + "from EvaluationEntity e where e.project.id = :projectId "
            + "group by e.evaluator.id")
    List<CountRow> givenCounts(@Param("projectId") Long projectId);

    @Query("select new com.peery.app.dto.CommentRow(e.evaluatee.id, e.comment) "
            + "from EvaluationEntity e "
            + "where e.project.id = :projectId and e.comment is not null")
    List<CommentRow> comments(@Param("projectId") Long projectId);
}