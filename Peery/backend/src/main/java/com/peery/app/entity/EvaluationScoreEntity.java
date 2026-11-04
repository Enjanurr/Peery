package com.peery.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluation_scores")
public class EvaluationScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false, updatable = false)
    private EvaluationEntity evaluation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterion_id", nullable = false, updatable = false)
    private CriterionEntity criterion;

    @Column(nullable = false)
    private int score;

    protected EvaluationScoreEntity() {
        // required by JPA
    }

    public EvaluationScoreEntity(EvaluationEntity evaluation, CriterionEntity criterion, int score) {
        this.evaluation = evaluation;
        this.criterion = criterion;
        this.score = score;
    }

    public Long getId() { return id; }
    public EvaluationEntity getEvaluation() { return evaluation; }
    public CriterionEntity getCriterion() { return criterion; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}