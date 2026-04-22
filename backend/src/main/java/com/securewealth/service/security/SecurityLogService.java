package com.securewealth.service.security;

import com.securewealth.model.SecurityEvent;
import com.securewealth.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityLogService {

    private final SecurityEventRepository securityEventRepository;

    public Page<SecurityEvent> getAuditLogs(Long userId, Pageable pageable) {
        return securityEventRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }
}
