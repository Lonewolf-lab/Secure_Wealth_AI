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
public class WealthActionRequest {
    private String actionType; // e.g., "INVEST_SIP", "WITHDRAW_MF"
    private BigDecimal amount;
    private String investmentType; 
    private String name;
}
