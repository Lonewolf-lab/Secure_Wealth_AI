package com.securewealth.service.security;

import com.securewealth.external.MLServiceClient;
import com.securewealth.model.BehaviorProfile;
import com.securewealth.repository.BehaviorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionService {

    private final BehaviorProfileRepository behaviorProfileRepository;
    private final MLServiceClient mlServiceClient;

    public boolean isAmountAnomalous(Long userId, BigDecimal amount) {
        if (amount == null) return false;

        // 1. Ask ML Service first (if available and returns true)
        if (mlServiceClient.checkAnomaly(userId, amount)) {
            return true;
        }

        // 2. Rule-based fallback
        return behaviorProfileRepository.findByUserId(userId)
                .map(profile -> {
                    BigDecimal avg = profile.getAvgTransactionAmount();
                    if (avg == null || avg.compareTo(BigDecimal.ZERO) == 0) return false;
                    // Anomaly if amount > 3x average
                    return amount.compareTo(avg.multiply(BigDecimal.valueOf(3))) > 0;
                })
                .orElse(false);
    }
}
