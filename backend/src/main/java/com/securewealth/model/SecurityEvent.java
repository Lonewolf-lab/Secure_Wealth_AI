package com.securewealth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.securewealth.model.enums.EventDecision;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    private String actionType;

    private int wprsScore;

    @Enumerated(EnumType.STRING)
    private EventDecision decision;

    @Column(length = 1000)
    private String reason;

    private String deviceId;

    private String ipAddress;

    private LocalDateTime timestamp;
}
