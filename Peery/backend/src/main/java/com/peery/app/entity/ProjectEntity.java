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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instructor_id", nullable = false, updatable = false)
    private UserEntity instructor;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "eval_start_date", nullable = false)
    private Instant evalStartDate;

    @Column(name = "eval_end_date", nullable = false)
    private Instant evalEndDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Lets JPA cascade a project delete down to its teams (and their members)
    @OneToMany(mappedBy = "project", cascade = CascadeType.REMOVE)
    private List<TeamEntity> teams = new ArrayList<>();

    protected ProjectEntity() {
        // required by JPA
    }

    public ProjectEntity(UserEntity instructor, String title, String description,
                         Instant evalStartDate, Instant evalEndDate) {
        this.instructor = instructor;
        this.title = title;
        this.description = description;
        this.evalStartDate = evalStartDate;
        this.evalEndDate = evalEndDate;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void update(String title, String description, Instant evalStartDate, Instant evalEndDate) {
        this.title = title;
        this.description = description;
        this.evalStartDate = evalStartDate;
        this.evalEndDate = evalEndDate;
    }

    public Long getId() { return id; }
    public UserEntity getInstructor() { return instructor; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Instant getEvalStartDate() { return evalStartDate; }
    public Instant getEvalEndDate() { return evalEndDate; }
    public Instant getCreatedAt() { return createdAt; }
}