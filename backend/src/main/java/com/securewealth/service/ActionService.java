package com.securewealth.service;

import com.securewealth.dto.request.WealthActionRequest;
import com.securewealth.model.Investment;
import com.securewealth.model.Portfolio;
import com.securewealth.model.enums.InvestmentStatus;
import com.securewealth.model.enums.InvestmentType;
import com.securewealth.repository.InvestmentRepository;
import com.securewealth.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionService {

    private final InvestmentRepository investmentRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioService portfolioService;
    private final GamificationService gamificationService;

    @Transactional
    public void executeInvestment(Long userId, WealthActionRequest request) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElseThrow();

        String typeStr = request.getInvestmentType();
        if (typeStr == null || typeStr.isBlank()) {
            typeStr = "MUTUAL_FUND"; // Default fallback
        }
        InvestmentType type = InvestmentType.valueOf(typeStr.toUpperCase());

        Investment investment = Investment.builder()
                .userId(userId)
                .portfolio(portfolio)
                .type(type)
                .name(request.getName() != null ? request.getName() : type.name() + " Investment")
                .amount(request.getAmount())
                .startDate(LocalDate.now())
                .status(InvestmentStatus.ACTIVE)
                .build();

        investmentRepository.save(investment);
        portfolioService.recalculateTotalValue(portfolio);
        gamificationService.recalculateWealthScore(userId); // update score post investment
        
        log.info("Executed investment action for user {}: {} {}", userId, type, request.getAmount());
    }
}
