package com.securewealth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRecommendationResponse {
    private String section;
    private String instrument;
    private BigDecimal suggestedAmount;
    private BigDecimal potentialTaxSaving;
    private String explanation;
}
