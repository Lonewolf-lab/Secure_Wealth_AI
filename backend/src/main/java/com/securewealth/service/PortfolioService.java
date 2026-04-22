package com.securewealth.service;

import com.securewealth.dto.response.PortfolioResponse;
import com.securewealth.model.Asset;
import com.securewealth.model.Investment;
import com.securewealth.model.Portfolio;
import com.securewealth.repository.AssetRepository;
import com.securewealth.repository.InvestmentRepository;
import com.securewealth.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final AssetRepository assetRepository;
    private final InvestmentRepository investmentRepository;

    public PortfolioResponse getPortfolio(Long userId) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found for user: " + userId));

        recalculateTotalValue(portfolio); 
        
        return PortfolioResponse.builder()
                .totalValue(portfolio.getTotalValue())
                .assets(portfolio.getAssets())
                .investments(portfolio.getInvestments())
                .build();
    }

    @Transactional
    public void recalculateTotalValue(Portfolio portfolio) {
        BigDecimal total = BigDecimal.ZERO;

        for (Asset asset : portfolio.getAssets()) {
            if (asset.getCurrentValue() != null) total = total.add(asset.getCurrentValue());
        }

        for (Investment investment : portfolio.getInvestments()) {
            if (investment.getAmount() != null) total = total.add(investment.getAmount());
        }

        portfolio.setTotalValue(total);
        portfolio.setLastUpdated(LocalDateTime.now());
        portfolioRepository.save(portfolio);
    }
}
