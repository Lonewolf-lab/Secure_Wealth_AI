package com.securewealth.service;

import com.securewealth.dto.request.LoginRequest;
import com.securewealth.dto.request.RegisterRequest;
import com.securewealth.dto.response.AuthResponse;
import com.securewealth.model.BehaviorProfile;
import com.securewealth.model.Portfolio;
import com.securewealth.model.User;
import com.securewealth.model.WealthScore;
import com.securewealth.model.enums.Role;
import com.securewealth.repository.BehaviorProfileRepository;
import com.securewealth.repository.PortfolioRepository;
import com.securewealth.repository.UserRepository;
import com.securewealth.repository.WealthScoreRepository;
import com.securewealth.service.security.VelocityTrackerService;
import com.securewealth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final BehaviorProfileRepository behaviorProfileRepository;
    private final WealthScoreRepository wealthScoreRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VelocityTrackerService velocityTrackerService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .createdAt(LocalDateTime.now())
                .role(Role.CUSTOMER)
                .build();
        user = userRepository.save(user);

        // Initialize empty Portfolio
        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .totalValue(BigDecimal.ZERO)
                .lastUpdated(LocalDateTime.now())
                .build();
        portfolioRepository.save(portfolio);

        // Initialize empty BehaviorProfile
        BehaviorProfile behaviorProfile = BehaviorProfile.builder()
                .user(user)
                .avgTransactionAmount(BigDecimal.valueOf(10000)) // default ₹10,000 avg
                .avgLoginHour(12)
                .actionSpeedAvgSeconds(0.0)
                .otpRetryCount(0)
                .cancelRetryCount(0)
                .lastUpdated(LocalDateTime.now())
                .build();
        behaviorProfileRepository.save(behaviorProfile);

        // Initialize WealthScore
        WealthScore wealthScore = WealthScore.builder()
                .user(user)
                .score(500) // Default starting score out of 1000
                .savingsScore(125)
                .goalScore(125)
                .investmentScore(125)
                .protectionScore(125)
                .lastUpdated(LocalDateTime.now())
                .build();
        wealthScoreRepository.save(wealthScore);

        String jwtToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        log.info("Registered new user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String jwtToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        // Record velocity timestamp in Redis on successful login
        velocityTrackerService.recordLogin(user.getId());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
