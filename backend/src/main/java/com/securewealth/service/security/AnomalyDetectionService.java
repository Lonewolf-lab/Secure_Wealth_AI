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
        boolean mlResult = mlServiceClient.checkAnomaly(userId, amount);
        log.info("ML anomaly check result for userId={}, amount={}: {}", userId, amount, mlResult);
        if (mlResult) {
            return true;
        }

        // 2. Rule-based fallback
        return behaviorProfileRepository.findByUserId(userId)
                .map(profile -> {
                    BigDecimal avg = profile.getAvgTransactionAmount();
                    log.info("BehaviorProfile avgTransactionAmount for userId={}: {}", userId, avg);
                    if (avg == null || avg.compareTo(BigDecimal.ZERO) == 0) {
                        avg = BigDecimal.valueOf(10000);
                    }
                    boolean isAnomaly = amount.compareTo(avg.multiply(BigDecimal.valueOf(3))) > 0;
                    log.info("Anomaly check: amount={}, avg={}, 3x avg={}, isAnomaly={}",
                            amount, avg, avg.multiply(BigDecimal.valueOf(3)), isAnomaly);
                    return isAnomaly;
                })
                .orElse(false);
    }
}
