package com.peery.app.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evaluations")
public class EvaluationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, updatable = false)
    private ProjectEntity project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluator_id", nullable = false, updatable = false)
    private UserEntity evaluator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluatee_id", nullable = false, updatable = false)
    private UserEntity evaluatee;

    @Column(length = 1000)
    private String comment;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Optimistic locking token; bumped on every edit. */
    @Version
    @Column(nullable = false)
    private Long version;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationScoreEntity> scores = new ArrayList<>();

    protected EvaluationEntity() {
        // required by JPA
    }

    public EvaluationEntity(ProjectEntity project, UserEntity evaluator, UserEntity evaluatee,
                            String comment, Instant submittedAt) {
        this.project = project;
        this.evaluator = evaluator;
        this.evaluatee = evaluatee;
        this.comment = comment;
        this.submittedAt = submittedAt;
    }

    public void addScore(CriterionEntity criterion, int score) {
        scores.add(new EvaluationScoreEntity(this, criterion, score));
    }

    /** Setting updatedAt dirties the row on every edit, which also bumps the version. */
    public void update(String comment, Instant updatedAt) {
        this.comment = comment;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public ProjectEntity getProject() { return project; }
    public UserEntity getEvaluator() { return evaluator; }
    public UserEntity getEvaluatee() { return evaluatee; }
    public String getComment() { return comment; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
    public List<EvaluationScoreEntity> getScores() { return scores; }
}