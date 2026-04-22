package com.securewealth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxQueryRequest {
    private int currentFinancialYear;
    // can add specific simulated investments here in the future
}
