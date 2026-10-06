package com.immersio.users.repository;

import com.immersio.users.domain.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {
    Optional<PasswordResetCode> findFirstByEmailOrderByCreatedAtDesc(String email);

    /** Latest not-yet-used code for this email, even if expired (.NET reset semantics). */
    Optional<PasswordResetCode> findFirstByEmailAndUsedAtIsNullOrderByCreatedAtDesc(String email);

    /** Still-active codes (unused + not expired) for invalidation on a new request. */
    List<PasswordResetCode> findAllByEmailAndUsedAtIsNullAndExpiresAtAfter(String email, Instant now);
}
