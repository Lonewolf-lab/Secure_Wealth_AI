package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.securewealth.model.enums.GoalCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    private String name;

    private BigDecimal targetAmount;

    private BigDecimal currentSaved;

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    private GoalCategory category;

    private LocalDateTime createdAt;
}
