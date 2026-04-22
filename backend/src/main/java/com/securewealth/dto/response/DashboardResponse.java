package com.securewealth.dto.response;

import com.securewealth.model.Goal;
import com.securewealth.model.Transaction;
import com.securewealth.model.WealthScore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal totalNetWorth;
    private BigDecimal monthlyIncome;
    private double monthlySavingsRate;
    private Goal topGoal;
    private WealthScore wealthScore;
    private List<Transaction> recentTransactions;
    private List<String> marketAlerts;
}
