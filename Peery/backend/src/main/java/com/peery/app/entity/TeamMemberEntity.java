package com.peery.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "team_members")
public class TeamMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false, updatable = false)
    private TeamEntity team;

    // Denormalised from the team; the DB composite FK keeps it consistent and
    // UNIQUE (project_id, student_id) enforces "one team per student per project".
    @Column(name = "project_id", nullable = false, updatable = false)
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, updatable = false)
    private UserEntity student;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TeamMemberEntity() {
        // required by JPA
    }

    public TeamMemberEntity(TeamEntity team, UserEntity student) {
        this.team = team;
        this.projectId = team.getProject().getId();
        this.student = student;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }
    public TeamEntity getTeam() { return team; }
    public Long getProjectId() { return projectId; }
    public UserEntity getStudent() { return student; }
    public Instant getCreatedAt() { return createdAt; }
}