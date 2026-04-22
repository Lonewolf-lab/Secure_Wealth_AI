package com.securewealth.service;

import com.securewealth.dto.response.TaxRecommendationResponse;
import com.securewealth.model.Investment;
import com.securewealth.model.enums.InvestmentType;
import com.securewealth.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxAdvisorService {

    private final InvestmentRepository investmentRepository;

    private static final BigDecimal LIMIT_80C = new BigDecimal("150000");
    private static final BigDecimal LIMIT_80D = new BigDecimal("25000");
    private static final BigDecimal LIMIT_80CCD = new BigDecimal("50000");
    private static final BigDecimal TAX_BRACKET = new BigDecimal("0.30"); // 30% assumption

    public List<TaxRecommendationResponse> getRecommendations(Long userId) {
        List<TaxRecommendationResponse> recommendations = new ArrayList<>();
        List<Investment> investments = investmentRepository.findByUserId(userId);

        BigDecimal current80CUsage = BigDecimal.ZERO;
        boolean hasNps = false;

        for (Investment inv : investments) {
            if (inv.getType() == InvestmentType.ELSS || inv.getType() == InvestmentType.PPF || inv.getType() == InvestmentType.FD) {
                current80CUsage = current80CUsage.add(inv.getAmount());
            }
            // Add other checks for NPS / Health Insurance based on notes or exact types if expanded
        }

        BigDecimal headroom80C = LIMIT_80C.subtract(current80CUsage);
        if (headroom80C.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal monthlySip = headroom80C.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
            recommendations.add(TaxRecommendationResponse.builder()
                    .section("80C")
                    .instrument("ELSS Mutual Fund")
                    .suggestedAmount(headroom80C)
                    .potentialTaxSaving(headroom80C.multiply(TAX_BRACKET))
                    .explanation("You have " + headroom80C + " headroom in 80C. Start an SIP of " + monthlySip + "/mo.")
                    .build());
        } else {
             // 80C is filled, so suggest NPS (80CCD)
             recommendations.add(TaxRecommendationResponse.builder()
                    .section("80CCD(1B)")
                    .instrument("National Pension System (NPS)")
                    .suggestedAmount(LIMIT_80CCD)
                    .potentialTaxSaving(LIMIT_80CCD.multiply(TAX_BRACKET))
                    .explanation("Your 80C is maxed out! Get additional 50k deduction via NPS.")
                    .build());
        }

        return recommendations;
    }
}
