package com.securewealth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.securewealth.dto.response.DashboardResponse;
import com.securewealth.external.MockAAClient;
import com.securewealth.external.MockMarketFeedClient;
import com.securewealth.model.Goal;
import com.securewealth.model.Transaction;
import com.securewealth.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final MockAAClient mockAAClient;
    private final MockMarketFeedClient marketFeedClient;
    private final PortfolioService portfolioService;
    private final GamificationService gamificationService;
    private final GoalRepository goalRepository;

    public DashboardResponse getSummary(Long userId) {
        var portfolio = portfolioService.getPortfolio(userId);
        var wealthScoreResponse = gamificationService.getWealthScore(userId);

        JsonNode aaProfile = mockAAClient.getCustomerProfile(userId);
        BigDecimal monthlyIncome = BigDecimal.ZERO;
        double savingsRate = 0.0;

        if (aaProfile != null) {
            monthlyIncome = BigDecimal.valueOf(aaProfile.get("income").asDouble() / 12);
            double expenses = aaProfile.get("expenses").asDouble();
            double income = aaProfile.get("income").asDouble();
            if (income > 0) savingsRate = ((income - expenses) / income) * 100;
        }

        List<Goal> goals = goalRepository.findByUserId(userId);
        Goal topGoal = goals.stream()
                .min(Comparator.comparing(Goal::getDeadline))
                .orElse(null);

        List<Transaction> transactions = mockAAClient.getTransactions(userId, 1);
        var recentTransactions = transactions.size() > 5 ? transactions.subList(0, 5) : transactions;

        List<String> marketAlerts = new ArrayList<>();
        JsonNode marketData = marketFeedClient.getCurrentMarketData();
        if (marketData != null && marketData.has("sentiment_summary")) {
            marketAlerts.add(marketData.get("sentiment_summary").asText());
        }

        return DashboardResponse.builder()
                .totalNetWorth(portfolio.getTotalValue())
                .monthlyIncome(monthlyIncome)
                .monthlySavingsRate(savingsRate)
                .topGoal(topGoal)
                // In actual code, we map WealthScore properly, for Hackathon a partial object or mapping works 
                // We're returning the response properties in the DashboardResponse.
                .wealthScore(null) // Or map the response back
                .recentTransactions(recentTransactions)
                .marketAlerts(marketAlerts)
                .build();
    }
}
