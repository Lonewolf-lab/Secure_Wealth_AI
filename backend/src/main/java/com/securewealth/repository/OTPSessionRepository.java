package com.securewealth.repository;

import com.securewealth.model.OTPSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OTPSessionRepository extends JpaRepository<OTPSession, Long> {
    Optional<OTPSession> findByUserIdAndActionTypeAndIsVerifiedFalseAndExpiresAtAfter(
            Long userId, String actionType, LocalDateTime currentTime);
}
