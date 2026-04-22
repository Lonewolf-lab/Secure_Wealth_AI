package com.securewealth.dto.response;

import com.securewealth.model.Asset;
import com.securewealth.model.Investment;
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
public class PortfolioResponse {
    private BigDecimal totalValue;
    private List<Asset> assets;
    private List<Investment> investments;
}
