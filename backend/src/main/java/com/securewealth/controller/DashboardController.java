package com.securewealth.controller;

import com.securewealth.dto.response.DashboardResponse;
import com.securewealth.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints for the main dashboard view")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get user dashboard summary")
    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> getSummary(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(dashboardService.getSummary(userId));
    }
}
