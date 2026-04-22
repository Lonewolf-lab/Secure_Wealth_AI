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
@Table(name = "otp_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OTPSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    @Column(nullable = false)
    private String otpHash;

    private int attemptCount;

    private String actionType;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private boolean isVerified;
}
