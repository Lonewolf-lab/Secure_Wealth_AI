package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.securewealth.model.enums.AssetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

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

    private String name;

    @Enumerated(EnumType.STRING)
    private AssetType type;

    private BigDecimal currentValue;

    private BigDecimal purchaseValue;

    private LocalDate purchaseDate;

    private String notes;
}
