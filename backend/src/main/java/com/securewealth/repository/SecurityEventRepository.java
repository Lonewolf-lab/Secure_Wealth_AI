package com.securewealth.repository;

import com.securewealth.model.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findByUserIdOrderByTimestampDesc(Long userId);
    Page<SecurityEvent> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    List<SecurityEvent> findByUserIdAndTimestampAfter(Long userId, LocalDateTime timestamp);
}
