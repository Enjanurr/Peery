package com.peery.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/** One immutable row per override action. The latest row for (project, student) is the current state. */
@Entity
@Table(name = "grade_overrides")
public class GradeOverrideEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, updatable = false)
    private ProjectEntity project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, updatable = false)
    private UserEntity student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instructor_id", nullable = false, updatable = false)
    private UserEntity instructor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, updatable = false)
    private OverrideAction action;

    @Column(name = "override_percent", precision = 5, scale = 2, updatable = false)
    private BigDecimal overridePercent;

    @Column(name = "computed_percent", precision = 5, scale = 2, updatable = false)
    private BigDecimal computedPercent;

    @Column(nullable = false, length = 1000, updatable = false)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected GradeOverrideEntity() {
        // required by JPA
    }

    public GradeOverrideEntity(ProjectEntity project, UserEntity student, UserEntity instructor,
                               OverrideAction action, BigDecimal overridePercent,
                               BigDecimal computedPercent, String reason, Instant createdAt) {
        this.project = project;
        this.student = student;
        this.instructor = instructor;
        this.action = action;
        this.overridePercent = overridePercent;
        this.computedPercent = computedPercent;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public ProjectEntity getProject() { return project; }
    public UserEntity getStudent() { return student; }
    public UserEntity getInstructor() { return instructor; }
    public OverrideAction getAction() { return action; }
    public BigDecimal getOverridePercent() { return overridePercent; }
    public BigDecimal getComputedPercent() { return computedPercent; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
}