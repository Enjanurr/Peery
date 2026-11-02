package com.peery.app.repository;

import com.peery.app.entity.RoleEntity;
import com.peery.app.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    List<UserEntity> findByRoleOrderByFullNameAsc(RoleEntity role);
}