package com.peery.app.repository;

import com.peery.app.entity.UserEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Account-level writes (name, email, password hash) without touching UserEntity or UserRepository.
 * The password hash is read and written with native SQL so it never has to pass through the entity.
 */
public interface UserAccountRepository extends Repository<UserEntity, Long> {

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query(value = "select password_hash from users where id = :id", nativeQuery = true)
    String findPasswordHash(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserEntity u set u.fullName = :fullName, u.email = :email where u.id = :id")
    int updateNameAndEmail(@Param("id") Long id,
                           @Param("fullName") String fullName,
                           @Param("email") String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update users set password_hash = :hash where id = :id", nativeQuery = true)
    int updatePasswordHash(@Param("hash") String hash, @Param("id") Long id);
}