package com.securewealth.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securewealth.model.*;
import com.securewealth.model.enums.*;
import com.securewealth.repository.*;
import com.securewealth.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final AssetRepository assetRepository;
    private final InvestmentRepository investmentRepository;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final BehaviorProfileRepository behaviorProfileRepository;
    private final WealthScoreRepository wealthScoreRepository;
    private final PasswordEncoder passwordEncoder;
    private final PortfolioService portfolioService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Database user count: {}", userRepository.count());
        userRepository.findAll().forEach(user -> log.info("Found existing database user: email={}, name={}", user.getEmail(), user.getName()));
        
        if (userRepository.findByEmail("arjun.sharma@example.com").isPresent()) {
            log.info("Database already seeded. Resetting mock users passwords to 'password123'...");
            for (String email : new String[]{"arjun.sharma@example.com", "priya.patel@example.com", "mohammed.ali@example.com"}) {
                userRepository.findByEmail(email).ifPresentOrElse(user -> {
                    user.setPasswordHash(passwordEncoder.encode("password123"));
                    userRepository.save(user);
                    log.info("Successfully reset password to 'password123' for user: {}", email);
                }, () -> {
                    log.warn("Mock user NOT found in database: {}", email);
                });
            }
            log.info("Mock users passwords check complete.");
            return;
        }

        log.info("Starting database seeding for mock AA profiles...");

        // Load customers.json
        InputStream customersStream = new ClassPathResource("mock-data/customers.json").getInputStream();
        JsonNode customersNode = objectMapper.readTree(customersStream);

        // Keep track of user mappings for transaction seeding
        Map<Long, User> userMap = new HashMap<>();
        Map<Long, Portfolio> portfolioMap = new HashMap<>();

        if (customersNode.isArray()) {
            for (JsonNode customer : customersNode) {
                Long mockId = customer.get("userId").asLong();
                String name = customer.get("name").asText();
                String email = customer.get("email").asText();
                String phone = customer.get("phone").asText();
                BigDecimal income = BigDecimal.valueOf(customer.get("income").asDouble());
                BigDecimal expenses = BigDecimal.valueOf(customer.get("expenses").asDouble());
                BigDecimal avgTransactionAmount = BigDecimal.valueOf(customer.get("avgTransactionAmount").asDouble());

                // 1. Create User
                User user = User.builder()
                        .name(name)
                        .email(email)
                        .passwordHash(passwordEncoder.encode("password123"))
                        .phone(phone)
                        .createdAt(LocalDateTime.now().minusDays(180))
                        .role(Role.CUSTOMER)
                        .build();
                user = userRepository.save(user);
                userMap.put(mockId, user);
                log.info("Seeded User: {} (ID: {})", email, user.getId());

                // 2. Create Portfolio
                Portfolio portfolio = Portfolio.builder()
                        .user(user)
                        .totalValue(BigDecimal.ZERO)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                portfolio = portfolioRepository.save(portfolio);
                portfolioMap.put(mockId, portfolio);

                // 3. Create BehaviorProfile
                BehaviorProfile behaviorProfile = BehaviorProfile.builder()
                        .user(user)
                        .avgTransactionAmount(avgTransactionAmount)
                        .avgLoginHour(12)
                        .actionSpeedAvgSeconds(1.5)
                        .otpRetryCount(0)
                        .cancelRetryCount(0)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                behaviorProfileRepository.save(behaviorProfile);

                // 4. Create WealthScore
                WealthScore wealthScore = WealthScore.builder()
                        .user(user)
                        .score(625)
                        .savingsScore(150)
                        .goalScore(175)
                        .investmentScore(150)
                        .protectionScore(150)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                wealthScoreRepository.save(wealthScore);

                // 5. Seed Assets
                JsonNode assets = customer.get("assets");
                if (assets != null && assets.isArray()) {
                    for (JsonNode assetNode : assets) {
                        String assetName = assetNode.get("name").asText();
                        String assetTypeStr = assetNode.get("type").asText();
                        BigDecimal currentValue = BigDecimal.valueOf(assetNode.get("currentValue").asDouble());

                        AssetType assetType;
                        try {
                            assetType = AssetType.valueOf(assetTypeStr.toUpperCase());
                        } catch (Exception e) {
                            assetType = AssetType.OTHER;
                        }

                        Asset asset = Asset.builder()
                                .portfolio(portfolio)
                                .userId(user.getId())
                                .name(assetName)
                                .type(assetType)
                                .currentValue(currentValue)
                                .purchaseValue(currentValue)
                                .purchaseDate(LocalDate.now().minusYears(1))
                                .notes("Seeded mock asset")
                                .build();
                        assetRepository.save(asset);
                    }
                }

                // 6. Seed Investments
                JsonNode investments = customer.get("investments");
                if (investments != null && investments.isArray()) {
                    for (JsonNode investmentNode : investments) {
                        String invTypeStr = investmentNode.get("type").asText();
                        String invName = investmentNode.get("name").asText();
                        BigDecimal amount = BigDecimal.valueOf(investmentNode.get("amount").asDouble());
                        String statusStr = investmentNode.get("status").asText();

                        InvestmentType invType;
                        try {
                            invType = InvestmentType.valueOf(invTypeStr.toUpperCase());
                        } catch (Exception e) {
                            invType = InvestmentType.SIP;
                        }

                        InvestmentStatus status;
                        try {
                            status = InvestmentStatus.valueOf(statusStr.toUpperCase());
                        } catch (Exception e) {
                            status = InvestmentStatus.ACTIVE;
                        }

                        Investment investment = Investment.builder()
                                .portfolio(portfolio)
                                .userId(user.getId())
                                .type(invType)
                                .name(invName)
                                .amount(amount)
                                .startDate(LocalDate.now().minusMonths(6))
                                .maturityDate(LocalDate.now().plusYears(1))
                                .status(status)
                                .sipFrequency("MONTHLY")
                                .build();
                        investmentRepository.save(investment);
                    }
                }

                // 7. Seed Goals
                JsonNode goals = customer.get("goals");
                if (goals != null && goals.isArray()) {
                    for (JsonNode goalNode : goals) {
                        String goalName = goalNode.get("name").asText();
                        BigDecimal targetAmount = BigDecimal.valueOf(goalNode.get("targetAmount").asDouble());
                        BigDecimal currentSaved = BigDecimal.valueOf(goalNode.get("currentSaved").asDouble());
                        String categoryStr = goalNode.get("category").asText();

                        GoalCategory category;
                        try {
                            category = GoalCategory.valueOf(categoryStr.toUpperCase());
                        } catch (Exception e) {
                            category = GoalCategory.OTHER;
                        }

                        Goal goal = Goal.builder()
                                .user(user)
                                .name(goalName)
                                .targetAmount(targetAmount)
                                .currentSaved(currentSaved)
                                .category(category)
                                .deadline(LocalDate.now().plusYears(3))
                                .createdAt(LocalDateTime.now().minusDays(180))
                                .build();
                        goalRepository.save(goal);
                    }
                }
            }
        }

        // Seed transactions.json
        InputStream transactionsStream = new ClassPathResource("mock-data/transactions.json").getInputStream();
        JsonNode transactionsNode = objectMapper.readTree(transactionsStream);

        if (transactionsNode.isArray()) {
            for (JsonNode txNode : transactionsNode) {
                Long mockUserId = txNode.get("userId").asLong();
                User user = userMap.get(mockUserId);
                if (user == null) {
                    // Fallback to Arjun if user doesn't exist
                    user = userMap.get(1L);
                }

                if (user != null) {
                    BigDecimal amount = BigDecimal.valueOf(txNode.get("amount").asDouble());
                    String typeStr = txNode.get("type").asText();
                    String category = txNode.get("category").asText();
                    String description = txNode.get("description").asText();
                    String channel = txNode.get("channel").asText();

                    TransactionType txType;
                    try {
                        txType = TransactionType.valueOf(typeStr.toUpperCase());
                    } catch (Exception e) {
                        txType = TransactionType.DEBIT;
                    }

                    Transaction transaction = Transaction.builder()
                            .user(user)
                            .amount(amount)
                            .type(txType)
                            .category(category)
                            .description(description)
                            .timestamp(LocalDateTime.now().minusDays((int) (Math.random() * 60)))
                            .channel(channel)
                            .build();
                    transactionRepository.save(transaction);
                }
            }
        }

        // 8. Recalculate portfolio values
        for (Portfolio portfolio : portfolioRepository.findAll()) {
            portfolioService.recalculateTotalValue(portfolio);
        }

        log.info("Database seeded successfully with {} users, assets, investments, goals, and transactions.", userRepository.count());
    }
}
