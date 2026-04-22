package com.securewealth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WPRSResponse {
    private int score;
    private String decision; // "ALLOW", "WARN", "BLOCK"
    private List<String> reasons;
    private Integer cooldownSeconds; // 300 for WARN, null otherwise
    private String actionType;
    private LocalDateTime timestamp;
}
