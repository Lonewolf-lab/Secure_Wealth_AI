package com.securewealth.service.security;

import com.securewealth.dto.response.WPRSResponse;
import com.securewealth.model.BehaviorProfile;
import com.securewealth.model.SecurityEvent;
import com.securewealth.model.User;
import com.securewealth.model.enums.EventDecision;
import com.securewealth.repository.BehaviorProfileRepository;
import com.securewealth.repository.InvestmentRepository;
import com.securewealth.repository.SecurityEventRepository;
import com.securewealth.repository.UserRepository;
import com.securewealth.util.WPRSCalculator;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class WPRSService {

    private static final Logger log = LoggerFactory.getLogger(WPRSService.class);

    private final DeviceTrustService deviceTrustService;
    private final VelocityTrackerService velocityTrackerService;
    private final AnomalyDetectionService anomalyDetectionService;
    private final BehaviorProfileRepository behaviorProfileRepository;
    private final InvestmentRepository investmentRepository;
    private final SecurityEventRepository securityEventRepository;
    private final UserRepository userRepository;

    public WPRSService(DeviceTrustService deviceTrustService,
                       VelocityTrackerService velocityTrackerService,
                       AnomalyDetectionService anomalyDetectionService,
                       BehaviorProfileRepository behaviorProfileRepository,
                       InvestmentRepository investmentRepository,
                       SecurityEventRepository securityEventRepository,
                       UserRepository userRepository) {
        this.deviceTrustService = deviceTrustService;
        this.velocityTrackerService = velocityTrackerService;
        this.anomalyDetectionService = anomalyDetectionService;
        this.behaviorProfileRepository = behaviorProfileRepository;
        this.investmentRepository = investmentRepository;
        this.securityEventRepository = securityEventRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WPRSResponse evaluate(Long userId, String actionType, BigDecimal actionAmount, String deviceId, HttpServletRequest request) {
        List<String> reasons = new ArrayList<>();
        
        // Ensure user and profile exist
        User user = userRepository.findById(userId).orElseThrow();
        BehaviorProfile profile = behaviorProfileRepository.findByUserId(userId)
                .orElseGet(() -> behaviorProfileRepository.save(BehaviorProfile.builder().user(user).build()));

        // 1. Device Trust Check
        boolean isNewDevice = false;
        try {
            isNewDevice = deviceTrustService.isNewDevice(userId, deviceId);
            if (isNewDevice) reasons.add("Unrecognized or new device detected (+30)");
        } catch (Exception e) { log.warn("Device check failed: {}", e.getMessage()); }

        // 2. Velocity Check
        boolean isVelocityFast = false;
        try {
            isVelocityFast = velocityTrackerService.isActionFast(userId);
            if (isVelocityFast) reasons.add("Action velocity extremely fast after login (+20)");
        } catch (Exception e) { log.warn("Velocity check failed: {}", e.getMessage()); }

        // 3. Amount Anomaly Check
        boolean isAmountAnomaly = false;
        try {
            isAmountAnomaly = anomalyDetectionService.isAmountAnomalous(userId, actionAmount);
            if (isAmountAnomaly) reasons.add("Transaction amount significantly exceeds historical average (+40)");
        } catch (Exception e) { log.warn("Anomaly check failed: {}", e.getMessage()); }

        // 4. First time action check
        boolean isFirstTimeAction = false;
        try {
            // Very simplified demo check: if they have no investments, any investment is "first time"
            if (actionType.startsWith("INVEST") && investmentRepository.findByUserId(userId).isEmpty()) {
                isFirstTimeAction = true;
                reasons.add("First time investment action type (+15)");
            }
        } catch (Exception e) { log.warn("First action check failed: {}", e.getMessage()); }

        // 5. Calculate Score
        int score = WPRSCalculator.calculate(
                isNewDevice, isVelocityFast, isAmountAnomaly, isFirstTimeAction,
                profile.getOtpRetryCount(),
                profile.getCancelRetryCount()
        );

        // 6. Determine Decision
        EventDecision decision;
        Integer cooldown = null;
        if (score > 60) {
            decision = EventDecision.BLOCK;
        } else if (score >= 30) {
            decision = EventDecision.WARN;
            cooldown = 60; // 1 mins
        } else {
            decision = EventDecision.ALLOW;
            if (reasons.isEmpty()) reasons.add("Normal behavior pattern. Proceeding safely.");
        }

        // 7. Log Event
        String ipAddress = request.getRemoteAddr();
        String reasonStr = String.join(" | ", reasons);
        
        SecurityEvent event = SecurityEvent.builder()
                .user(user)
                .actionType(actionType)
                .wprsScore(score)
                .decision(decision)
                .reason(reasonStr.length() > 990 ? reasonStr.substring(0, 990) : reasonStr)
                .deviceId(deviceId)
                .ipAddress(ipAddress)
                .timestamp(LocalDateTime.now())
                .build();
        securityEventRepository.save(event);
        
        log.info("WPRS Evaluated - User: {}, Action: {}, Score: {}, Decision: {}", userId, actionType, score, decision);

        return WPRSResponse.builder()
                .score(score)
                .decision(decision.name())
                .reasons(reasons)
                .cooldownSeconds(cooldown)
                .actionType(actionType)
                .timestamp(event.getTimestamp())
                .build();
    }
}
