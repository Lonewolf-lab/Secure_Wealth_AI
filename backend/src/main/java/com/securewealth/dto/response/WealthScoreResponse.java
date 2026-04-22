package com.securewealth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WealthScoreResponse {
    private int totalScore;
    private Map<String, Integer> categoryScores; 
    private Map<String, String> categoryExplanations;
}
