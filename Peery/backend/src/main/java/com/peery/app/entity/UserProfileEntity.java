package com.peery.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Optional, role-specific profile fields. One row per user, keyed by the user's id. */
@Entity
@Table(name = "user_profiles")
public class UserProfileEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "student_number", length = 50)
    private String studentNumber;

    @Column(length = 100)
    private String program;

    @Column(name = "employee_code", length = 50)
    private String employeeCode;

    @Column(length = 100)
    private String department;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserProfileEntity() {
        // required by JPA
    }

    public UserProfileEntity(Long userId, Instant now) {
        this.userId = userId;
        this.updatedAt = now;
    }

    public void update(String studentNumber, String program, String employeeCode, String department, Instant now) {
        this.studentNumber = studentNumber;
        this.program = program;
        this.employeeCode = employeeCode;
        this.department = department;
        this.updatedAt = now;
    }

    public Long getUserId() { return userId; }
    public String getStudentNumber() { return studentNumber; }
    public String getProgram() { return program; }
    public String getEmployeeCode() { return employeeCode; }
    public String getDepartment() { return department; }
    public Instant getUpdatedAt() { return updatedAt; }
}