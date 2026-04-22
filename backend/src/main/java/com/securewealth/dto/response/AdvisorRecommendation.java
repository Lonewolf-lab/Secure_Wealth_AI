package com.securewealth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorRecommendation {
    private String title;
    private String description;
    private String type; // SIP, FD, GOLD, REBALANCE, TAX
    private double confidenceScore; // 0.0 - 1.0
    private String explanation;
    private String marketTrigger;
}
