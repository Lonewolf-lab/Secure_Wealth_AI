package com.securewealth.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.securewealth.dto.response.AdvisorRecommendation;
import com.securewealth.service.AdvisorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advisor")
@RequiredArgsConstructor
@Tag(name = "AI Advisor", description = "Endpoints for ML-driven recommendations")
public class AdvisorController {

    private final AdvisorService advisorService;

    @Operation(summary = "Get personalized portfolio recommendations")
    @GetMapping("/recommendations")
    public ResponseEntity<List<AdvisorRecommendation>> getRecommendations(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(advisorService.getRecommendations(userId));
    }

    @Operation(summary = "Get AI market insights and sentiment")
    @GetMapping("/market-insights")
    public ResponseEntity<JsonNode> getMarketInsights() {
        return ResponseEntity.ok(advisorService.getMarketInsights());
    }
}
