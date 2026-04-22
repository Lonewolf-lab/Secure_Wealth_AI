package com.securewealth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddAssetRequest {
    private String name;
    private String type; // GOLD, PROPERTY, etc.
    private BigDecimal currentValue;
    private BigDecimal purchaseValue;
    private LocalDate purchaseDate;
    private String notes;
}
