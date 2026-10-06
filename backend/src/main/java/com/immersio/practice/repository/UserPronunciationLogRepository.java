package com.immersio.practice.repository;
import com.immersio.practice.domain.UserPronunciationLog; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface UserPronunciationLogRepository extends JpaRepository<UserPronunciationLog,UUID>{List<UserPronunciationLog> findAllByUserIdOrderByPracticedAtDesc(UUID userId);}
