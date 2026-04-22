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
public class CreateGoalRequest {
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentSaved;
    private LocalDate deadline;
    private String category; // HOME, EDUCATION, etc.
}
