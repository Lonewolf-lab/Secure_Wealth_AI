package com.securewealth.external;

import com.securewealth.dto.request.ChatRequest;
import com.securewealth.dto.response.AdvisorRecommendation;
import com.securewealth.dto.response.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MLServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ml-service.base-url}")
    private String baseUrl;

    public List<AdvisorRecommendation> getRecommendations(Long userId) {
        try {
            String url = baseUrl + "/api/ml/recommendations?userId=" + userId;
            ResponseEntity<AdvisorRecommendation[]> response = restTemplate.getForEntity(url, AdvisorRecommendation[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return List.of(response.getBody());
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable for recommendations, using fallback rules. Error: {}", e.getMessage());
        }
        return getFallbackRecommendations();
    }

    public boolean checkAnomaly(Long userId, BigDecimal amount) {
        try {
            String url = baseUrl + "/api/ml/anomaly-check?userId=" + userId + "&amount=" + amount;
            ResponseEntity<Boolean> response = restTemplate.getForEntity(url, Boolean.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
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
            log.warn("ML Service unreachable for chat, using fallback rules. Error: {}", e.getMessage());
        }
        return getFallbackChatResponse(request);
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
        if (msg.contains("tax")) reply = "You should consider ELSS funds or PPF to maximize your 80C deductions up to ₹1.5L.";
        else if (msg.contains("gold")) reply = "Gold is a safe haven. Would you like to check current gold prices or invest in Sovereign Gold Bonds?";
        
        return ChatResponse.builder().response(reply).build();
    }
}
