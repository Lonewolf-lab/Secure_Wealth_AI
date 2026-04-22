package com.securewealth.controller;

import com.securewealth.dto.response.TaxRecommendationResponse;
import com.securewealth.service.TaxAdvisorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
@Tag(name = "Tax Planning", description = "Endpoints for AI tax optimization")
public class TaxController {

    private final TaxAdvisorService taxAdvisorService;

    @Operation(summary = "Get personalized tax saving recommendations")
    @GetMapping("/recommendations")
    public ResponseEntity<List<TaxRecommendationResponse>> getRecommendations(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(taxAdvisorService.getRecommendations(userId));
    }
}
