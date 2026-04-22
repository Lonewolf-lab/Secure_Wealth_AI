package com.securewealth.service.security;

import com.securewealth.model.BehaviorProfile;
import com.securewealth.model.OTPSession;
import com.securewealth.model.User;
import com.securewealth.repository.BehaviorProfileRepository;
import com.securewealth.repository.OTPSessionRepository;
import com.securewealth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OTPSimulationService {

    private final OTPSessionRepository otpSessionRepository;
    private final UserRepository userRepository;
    private final BehaviorProfileRepository behaviorProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public String generateOTP(Long userId, String actionType) {
        User user = userRepository.findById(userId).orElseThrow();
        String plainOtp = String.format("%06d", new Random().nextInt(999999));
        
        OTPSession session = OTPSession.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(plainOtp))
                .attemptCount(0)
                .actionType(actionType)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isVerified(false)
                .build();
                
        otpSessionRepository.save(session);
        log.info("Generated OTP for user {}: {}", userId, plainOtp); // Only logging for hackathon demo purposes
        
        // Simulating returning masked phone + session ID equivalent. In real app, we'd send via SMS.
        return "Sent to " + user.getPhone().replaceAll(".(?=.{4})", "*");
    }

    @Transactional
    public boolean verifyOTP(Long userId, String otp, String actionType) {
        var sessionOpt = otpSessionRepository.findByUserIdAndActionTypeAndIsVerifiedFalseAndExpiresAtAfter(
                userId, actionType, LocalDateTime.now());

        if (sessionOpt.isEmpty()) return false;

        OTPSession session = sessionOpt.get();
        session.setAttemptCount(session.getAttemptCount() + 1);

        if (passwordEncoder.matches(otp, session.getOtpHash())) {
            session.setVerified(true);
            otpSessionRepository.save(session);
            return true;
        }

        otpSessionRepository.save(session);

        // Update behavior profile if too many retries
        if (session.getAttemptCount() > 2) {
            behaviorProfileRepository.findByUserId(userId).ifPresent(profile -> {
                profile.setOtpRetryCount(profile.getOtpRetryCount() + 1);
                behaviorProfileRepository.save(profile);
            });
        }
        
        return false;
    }
}
