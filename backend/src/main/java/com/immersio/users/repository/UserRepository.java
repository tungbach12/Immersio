package com.immersio.users.repository;

import com.immersio.users.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findAllByIsDeletedFalse();
    long countByIsDeletedFalse();

    /** Used by the admin bootstrap to detect an install that already has an administrator. */
    long countByRoleAndEmailIgnoreCase(String role, String email);

    @Query("select count(u) from User u where u.isDeleted = false and u.subscriptionTier <> 'Basic' "
            + "and u.subscriptionExpiresAt > :now")
    long countActiveSubscriptions(java.time.Instant now);
}
