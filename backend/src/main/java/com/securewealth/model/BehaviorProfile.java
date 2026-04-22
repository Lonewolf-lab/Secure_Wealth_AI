package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "behavior_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BehaviorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    private BigDecimal avgTransactionAmount;

    private int avgLoginHour;

    private double actionSpeedAvgSeconds;

    private int otpRetryCount;

    private int cancelRetryCount;

    private LocalDateTime lastUpdated;
}
