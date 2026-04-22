package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "wealth_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WealthScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    private int score;

    private int savingsScore;

    private int goalScore;

    private int investmentScore;

    private int protectionScore;

    private LocalDateTime lastUpdated;
}
