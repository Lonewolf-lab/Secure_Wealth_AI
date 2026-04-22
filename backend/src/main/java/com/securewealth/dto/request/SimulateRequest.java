package com.securewealth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulateRequest {
    private String scenarioName;
    private BigDecimal amount;
    private String type; // BUY_ASSET, START_SIP, WITHDRAW
    private Long goalId; // Optional goal association
}
