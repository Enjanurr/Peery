package com.peery.app.repository;

import com.peery.app.entity.GradeOverrideEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GradeOverrideRepository extends JpaRepository<GradeOverrideEntity, Long> {

    Optional<GradeOverrideEntity> findFirstByProjectIdAndStudentIdOrderByIdDesc(Long projectId, Long studentId);

    /** Newest first. */
    @Query("select o from GradeOverrideEntity o join fetch o.instructor "
            + "where o.project.id = :projectId and o.student.id = :studentId "
            + "order by o.id desc")
    List<GradeOverrideEntity> findHistory(@Param("projectId") Long projectId,
                                          @Param("studentId") Long studentId);

    /** The most recent row for every student in a project. */
    @Query("select o from GradeOverrideEntity o "
            + "where o.project.id = :projectId and o.id in ("
            + "  select max(o2.id) from GradeOverrideEntity o2 "
            + "  where o2.project.id = :projectId group by o2.student.id)")
    List<GradeOverrideEntity> findLatestPerStudent(@Param("projectId") Long projectId);
}