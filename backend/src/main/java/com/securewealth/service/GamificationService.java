package com.securewealth.service;

import com.securewealth.dto.response.WealthScoreResponse;
import com.securewealth.model.WealthScore;
import com.securewealth.repository.GoalRepository;
import com.securewealth.repository.InvestmentRepository;
import com.securewealth.repository.SecurityEventRepository;
import com.securewealth.repository.WealthScoreRepository;
import com.securewealth.model.enums.EventDecision;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final WealthScoreRepository wealthScoreRepository;
    private final GoalRepository goalRepository;
    private final InvestmentRepository investmentRepository;
    private final SecurityEventRepository securityEventRepository;

    @Transactional
    public void recalculateWealthScore(Long userId) {
        WealthScore wealthScore = wealthScoreRepository.findByUserId(userId).orElseThrow();

        // 1. Savings Score (Mocked out for brevity, ideally would fetch income/expense from Profile)
        int savingsScore = 125; // Base score
        // Real implementation: calculate saving rate (Income - Expense) / Income

        // 2. Goal Score (0-250) Avg completion % * 2.5
        var goals = goalRepository.findByUserId(userId);
        int goalScore = 0;
        if (!goals.isEmpty()) {
            double avgCompletion = goals.stream()
                    .mapToDouble(g -> g.getCurrentSaved().doubleValue() / g.getTargetAmount().doubleValue())
                    .average().orElse(0.0);
            goalScore = Math.min(250, (int) (avgCompletion * 100 * 2.5));
        }

        // 3. Investment Score (0-250)
        var activeInvestments = investmentRepository.findByUserId(userId);
        int investmentScore = Math.min(250, activeInvestments.size() * 30);

        // 4. Protection Score (0-250)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        var recentEvents = securityEventRepository.findByUserIdAndTimestampAfter(userId, thirtyDaysAgo);
        long blockCount = recentEvents.stream()
                .filter(e -> EventDecision.BLOCK.equals(e.getDecision()))
                .count();
        
        int protectionScore = Math.max(0, 250 - (int) (blockCount * 50));

        // Aggregate
        wealthScore.setSavingsScore(savingsScore);
        wealthScore.setGoalScore(goalScore);
        wealthScore.setInvestmentScore(investmentScore);
        wealthScore.setProtectionScore(protectionScore);
        wealthScore.setScore(savingsScore + goalScore + investmentScore + protectionScore);
        wealthScore.setLastUpdated(LocalDateTime.now());

        wealthScoreRepository.save(wealthScore);
    }

    public WealthScoreResponse getWealthScore(Long userId) {
        recalculateWealthScore(userId); // Compute on-the-fly for freshness
        WealthScore ws = wealthScoreRepository.findByUserId(userId).orElseThrow();
        
        Map<String, Integer> categoryScores = new HashMap<>();
        categoryScores.put("Savings", ws.getSavingsScore());
        categoryScores.put("Goals", ws.getGoalScore());
        categoryScores.put("Investments", ws.getInvestmentScore());
        categoryScores.put("Protection", ws.getProtectionScore());

        Map<String, String> categoryExplanations = new HashMap<>();
        categoryExplanations.put("Savings", "Consistent savings rate adds to your score.");
        categoryExplanations.put("Goals", "Progress towards your defined financial goals.");
        categoryExplanations.put("Investments", "Diversification and number of active investments.");
        categoryExplanations.put("Protection", "Avoid blocked actions to keep security high.");

        return WealthScoreResponse.builder()
                .totalScore(ws.getScore())
                .categoryScores(categoryScores)
                .categoryExplanations(categoryExplanations)
                .build();
    }
}
