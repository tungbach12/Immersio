package com.immersio.users.repository;

import com.immersio.users.domain.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {
    Optional<PasswordResetCode> findFirstByEmailOrderByCreatedAtDesc(String email);
}
