package com.securewealth.controller;

import com.securewealth.dto.response.PortfolioResponse;
import com.securewealth.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portfolio", description = "Endpoints for portfolio management")
public class PortfolioController {

    private final PortfolioService portfolioService;

    @Operation(summary = "Get user's full portfolio")
    @GetMapping("/")
    public ResponseEntity<PortfolioResponse> getPortfolio(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(portfolioService.getPortfolio(userId));
    }

    @Operation(summary = "Get portfolio historical performance (mocked time-series)")
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getPortfolioHistory(@RequestAttribute("X-User-Id") Long userId) {
        // For hackathon combo chart demo, returning mock historical data
        List<Map<String, Object>> history = new ArrayList<>();
        PortfolioResponse portfolio = portfolioService.getPortfolio(userId);
        double currentNetWorth = portfolio.getTotalValue() != null ? portfolio.getTotalValue().doubleValue() : 500000.0;
        
        for (int i = 11; i >= 0; i--) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", "Month " + (12 - i));
            point.put("value", currentNetWorth * (1 - (i * 0.05))); // Simulating past lower values
            history.add(point);
        }
        return ResponseEntity.ok(history);
    }
}
