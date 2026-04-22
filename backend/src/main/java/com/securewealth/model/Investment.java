package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.securewealth.model.enums.InvestmentStatus;
import com.securewealth.model.enums.InvestmentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "portfolio_id")
    @JsonIgnore
    @ToString.Exclude
    private Portfolio portfolio;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    private InvestmentType type;

    private String name;

    private BigDecimal amount;

    private LocalDate startDate;

    private LocalDate maturityDate;

    @Enumerated(EnumType.STRING)
    private InvestmentStatus status;

    private String sipFrequency;
}
