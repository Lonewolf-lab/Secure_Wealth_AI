package com.securewealth.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.securewealth.dto.request.ChatRequest;
import com.securewealth.dto.response.AdvisorRecommendation;
import com.securewealth.dto.response.ChatResponse;
import com.securewealth.model.Goal;
import com.securewealth.model.Portfolio;
import com.securewealth.model.Transaction;
import com.securewealth.model.User;
import com.securewealth.model.enums.GoalCategory;
import com.securewealth.repository.GoalRepository;
import com.securewealth.repository.PortfolioRepository;
import com.securewealth.repository.TransactionRepository;
import com.securewealth.repository.TrustedDeviceRepository;
import com.securewealth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class MLServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final GoalRepository goalRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final TransactionRepository transactionRepository;
    private final MockAAClient mockAAClient;

    @Value("${app.ml-service.base-url}")
    private String baseUrl;

    public List<AdvisorRecommendation> getRecommendations(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            
            // Map age based on mock client details or default
            int age = 30;
            int riskScore = 7;
            if (user != null) {
                if (user.getName().contains("Arjun")) {
                    age = 29;
                    riskScore = 8;
                } else if (user.getName().contains("Priya")) {
                    age = 24;
                    riskScore = 5;
                } else if (user.getName().contains("Ali") || user.getName().contains("Mohammed")) {
                    age = 55;
                    riskScore = 3;
                }
            }

            // Retrieve aggregator details (Income, Expenses)
            BigDecimal annualIncome = BigDecimal.valueOf(1200000); // Default 12L
            BigDecimal monthlyExpenses = BigDecimal.valueOf(50000);  // Default 50k
            BigDecimal currentSavings = BigDecimal.valueOf(900000);   // Default 9L

            JsonNode aaProfile = mockAAClient.getCustomerProfile(userId);
            if (aaProfile != null) {
                if (aaProfile.has("income")) {
                    annualIncome = BigDecimal.valueOf(aaProfile.get("income").asDouble());
                }
                if (aaProfile.has("expenses")) {
                    monthlyExpenses = BigDecimal.valueOf(aaProfile.get("expenses").asDouble());
                }
            }

            // Savings from portfolio total value
            Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);
            if (portfolio != null && portfolio.getTotalValue() != null) {
                currentSavings = portfolio.getTotalValue();
            }

            // Compute disposable income
            BigDecimal disposableIncome = annualIncome.subtract(monthlyExpenses.multiply(BigDecimal.valueOf(12)))
                    .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
            if (disposableIncome.compareTo(BigDecimal.ZERO) < 0) {
                disposableIncome = BigDecimal.ZERO;
            }

            // Derive Tax Bracket
            String taxBracket = "20%";
            if (annualIncome.compareTo(BigDecimal.valueOf(1500000)) > 0) {
                taxBracket = "30%";
            } else if (annualIncome.compareTo(BigDecimal.valueOf(1000000)) > 0) {
                taxBracket = "20%";
            } else if (annualIncome.compareTo(BigDecimal.valueOf(500000)) > 0) {
                taxBracket = "5%";
            } else {
                taxBracket = "0%";
            }

            // Map user primary goal category and horizon
            List<Goal> goals = goalRepository.findByUserId(userId);
            String goalStr = "Wealth Creation";
            int horizonMonths = 60; // Default 5 years

            if (!goals.isEmpty()) {
                Goal primaryGoal = goals.get(0);
                goalStr = mapGoalCategoryToMLGoal(primaryGoal.getCategory());
                if (primaryGoal.getDeadline() != null) {
                    horizonMonths = (int) ChronoUnit.MONTHS.between(LocalDate.now(), primaryGoal.getDeadline());
                    if (horizonMonths < 6) horizonMonths = 6;
                    if (horizonMonths > 120) horizonMonths = 120;
                }
            }

            // Construct prediction request payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("Age", age);
            payload.put("Annual_Income_INR", annualIncome);
            payload.put("Current_Savings_INR", currentSavings);
            payload.put("Monthly_Disposable_Income_INR", disposableIncome);
            payload.put("Tax_Bracket", taxBracket);
            payload.put("Financial_Goal", goalStr);
            payload.put("Risk_Appetite_Score", riskScore);
            payload.put("Investment_Horizon_Months", horizonMonths);

            log.info("Sending prediction payload to ML service: {}", payload);

            String url = baseUrl + "/api/predict";
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, payload, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> body = responseEntity.getBody();
                if (Boolean.TRUE.equals(body.get("success"))) {
                    String recommendedAsset = (String) body.get("recommended_asset_class");
                    String source = (String) body.get("source");
                    String reason = (String) body.get("reason");
                    
                    Map<String, Double> probs = (Map<String, Double>) body.get("class_probabilities");
                    double confidence = 0.0;
                    if (probs != null && probs.containsKey(recommendedAsset)) {
                        Object probObj = probs.get(recommendedAsset);
                        if (probObj instanceof Number) {
                            confidence = ((Number) probObj).doubleValue();
                        }
                    }

                    List<AdvisorRecommendation> recs = new ArrayList<>();
                    recs.add(AdvisorRecommendation.builder()
                            .title("AI Advisor: Consider " + recommendedAsset)
                            .description("Based on your financial parameters, the machine learning model recommends allocating funds into " + recommendedAsset + ".")
                            .type("INVESTMENT")
                            .confidenceScore(confidence)
                            .explanation(reason != null ? reason : "Recommended by XGBoost Model based on profile criteria (Source: " + source + ").")
                            .marketTrigger("Calculated using current net worth of ₹" + currentSavings)
                            .build());
                    return recs;
                }
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable for recommendations, using fallback rules. Error: {}", e.getMessage());
        }
        return getFallbackRecommendations();
    }

    public boolean checkAnomaly(Long userId, BigDecimal amount) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("Transaction_Amount_INR", amount);
            payload.put("Transaction_Type", "UPI");
            payload.put("Merchant_Category", "Others");
            payload.put("Hour_of_Day", LocalDateTime.now().getHour());
            payload.put("Day_of_Week", LocalDateTime.now().getDayOfWeek().getValue() - 1); // 0=Monday ... 6=Sunday

            // Device Trust Status
            int isNewDevice = 1;
            var trustedDevices = trustedDeviceRepository.findByUserId(userId);
            if (!trustedDevices.isEmpty()) {
                isNewDevice = 0;
            }
            payload.put("Is_New_Device", isNewDevice);
            payload.put("Is_New_Location", 0);
            payload.put("Distance_From_Home_KM", 3.5);

            // Account Age
            long accountAgeDays = 180;
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getCreatedAt() != null) {
                accountAgeDays = ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now());
            }
            payload.put("Account_Age_Days", accountAgeDays);

            // Minutes since last transaction
            double timeSinceLastTx = 120.0;
            List<Transaction> txList = transactionRepository.findByUserIdOrderByTimestampDesc(userId);
            if (!txList.isEmpty()) {
                Transaction lastTx = txList.get(0);
                timeSinceLastTx = ChronoUnit.MINUTES.between(lastTx.getTimestamp(), LocalDateTime.now());
                if (timeSinceLastTx < 0) {
                    timeSinceLastTx = 0;
                }
            }
            payload.put("Time_Since_Last_Transaction_Minutes", timeSinceLastTx);

            log.info("Sending anomaly-check payload to ML service: {}", payload);

            String url = baseUrl + "/api/detect-fraud";
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, payload, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> body = responseEntity.getBody();
                if (Boolean.TRUE.equals(body.get("success"))) {
                    boolean isAnomaly = Boolean.TRUE.equals(body.get("is_anomaly"));
                    log.info("ML anomaly check returned isAnomaly={}", isAnomaly);
                    return isAnomaly;
                }
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable for anomaly detection, using fallback rules. Error: {}", e.getMessage());
        }
        return false; // Fallback handled by AnomalyDetectionService
    }

    public ChatResponse chat(ChatRequest request) {
        try {
            String url = baseUrl + "/api/ml/chat";
            ResponseEntity<ChatResponse> response = restTemplate.postForEntity(url, request, ChatResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable for chat, using fallback. Error: {}", e.getMessage());
        }
        return getFallbackChatResponse(request);
    }

    private String mapGoalCategoryToMLGoal(GoalCategory category) {
        if (category == null) return "Wealth Creation";
        switch (category) {
            case RETIREMENT:
                return "Retirement";
            case TRAVEL:
            case VEHICLE:
                return "Short-term Gain";
            default:
                return "Wealth Creation";
        }
    }

    private List<AdvisorRecommendation> getFallbackRecommendations() {
        List<AdvisorRecommendation> fallback = new ArrayList<>();
        fallback.add(AdvisorRecommendation.builder()
                .title("Consider ELSS for Tax Saving")
                .description("Based on your profile, investing in ELSS could save you up to ₹46,800 in taxes under Section 80C.")
                .type("TAX")
                .confidenceScore(0.85)
                .explanation("Rule-based fallback: No active ELSS found in portfolio.")
                .marketTrigger("Tax season approaches")
                .build());
        return fallback;
    }

    private ChatResponse getFallbackChatResponse(ChatRequest request) {
        String msg = request.getMessage() != null ? request.getMessage().toLowerCase() : "";
        String reply = "I am currently running in offline mode. However, I can help you with your portfolio, tax planning, or goal setting. What would you like to explore?";
        if (msg.contains("tax")) {
            reply = "You should consider ELSS funds or PPF to maximize your 80C deductions up to ₹1.5L.";
        } else if (msg.contains("gold")) {
            reply = "Gold is a safe haven. Would you like to check current gold prices or invest in Sovereign Gold Bonds?";
        }
        return ChatResponse.builder().response(reply).build();
    }
}
