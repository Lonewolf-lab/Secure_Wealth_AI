package com.securewealth.service;

import com.securewealth.dto.request.CreateGoalRequest;
import com.securewealth.model.Goal;
import com.securewealth.model.Investment;
import com.securewealth.model.User;
import com.securewealth.model.enums.GoalCategory;
import com.securewealth.model.enums.InvestmentType;
import com.securewealth.repository.GoalRepository;
import com.securewealth.repository.InvestmentRepository;
import com.securewealth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final InvestmentRepository investmentRepository;

    public List<Goal> getGoals(Long userId) {
        return goalRepository.findByUserId(userId);
    }

    @Transactional
    public Goal createGoal(Long userId, CreateGoalRequest request) {
        User user = userRepository.findById(userId).orElseThrow();

        Goal goal = Goal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .currentSaved(request.getCurrentSaved())
                .deadline(request.getDeadline())
                .category(GoalCategory.valueOf(request.getCategory().toUpperCase()))
                .createdAt(LocalDateTime.now())
                .build();

        return goalRepository.save(goal);
    }

    public Map<String, Object> getGoalProjection(Long userId, Long goalId) {
        Goal goal = goalRepository.findById(goalId).orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to goal");
        }

        long months = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getDeadline());
        if (months <= 0) {
            months = 1;
        }

        // Sum active SIPs & ELSS
        BigDecimal monthlySIP = investmentRepository.findByUserId(userId).stream()
                .filter(inv -> inv.getType() == InvestmentType.SIP || inv.getType() == InvestmentType.ELSS)
                .map(Investment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fallback to default ₹10,000 if user has no active SIPs
        if (monthlySIP.compareTo(BigDecimal.ZERO) == 0) {
            monthlySIP = BigDecimal.valueOf(10000);
        }

        double P = goal.getCurrentSaved().doubleValue();
        double PMT = monthlySIP.doubleValue();
        double r = 0.12 / 12; // 12% annual compounding monthly
        double n = months;

        double fvLumpSum = P * Math.pow(1 + r, n);
        double fvAnnuity = PMT * ((Math.pow(1 + r, n) - 1) / r);
        double totalProjected = fvLumpSum + fvAnnuity;

        double target = goal.getTargetAmount().doubleValue();
        String status = totalProjected >= target ? "ON_TRACK" : "BEHIND";

        String suggestion;
        if (status.equals("ON_TRACK")) {
            suggestion = "Excellent! Your initial saved corpus of ₹" + String.format("%,.0f", P) + 
                    " along with active monthly savings of ₹" + String.format("%,.0f", PMT) + 
                    " is projected to reach ₹" + String.format("%,.0f", totalProjected) + 
                    " in " + months + " months, which comfortably meets your target of ₹" + String.format("%,.0f", target) + ".";
        } else {
            double gap = target - totalProjected;
            // Solve PMT for target under same variables: T = P*(1+r)^n + PMT*[((1+r)^n - 1)/r]
            double requiredPMT = (target - fvLumpSum) * r / (Math.pow(1 + r, n) - 1);
            double monthlyIncrease = requiredPMT - PMT;
            if (monthlyIncrease < 0) {
                monthlyIncrease = 0;
            }
            suggestion = "You are currently behind by ₹" + String.format("%,.0f", gap) + 
                    ". Projected: ₹" + String.format("%,.0f", totalProjected) + 
                    " vs Target: ₹" + String.format("%,.0f", target) + 
                    ". Twin Suggestion: Increase your monthly savings contribution by ₹" + String.format("%,.0f", monthlyIncrease) + 
                    " or extend your deadline.";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("projectedAmountAtDeadline", (long) totalProjected);
        result.put("suggestion", suggestion);
        return result;
    }
}
