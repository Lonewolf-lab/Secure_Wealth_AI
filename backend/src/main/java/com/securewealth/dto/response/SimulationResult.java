package com.securewealth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResult {
    private double successProbability; // %
    private List<YearlyProjection> projectedNetWorth;
    private Map<String, String> goalImpacts; // Goal Name -> New Completion Date

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YearlyProjection {
        private int year;
        private BigDecimal p10;
        private BigDecimal p50; // Median
        private BigDecimal p90;
    }
}
