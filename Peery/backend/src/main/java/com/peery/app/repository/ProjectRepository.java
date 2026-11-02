package com.peery.app.repository;

import com.peery.app.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    List<ProjectEntity> findByInstructorIdOrderByCreatedAtDesc(Long instructorId);

    Optional<ProjectEntity> findByIdAndInstructorId(Long id, Long instructorId);
}