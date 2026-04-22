package com.securewealth.controller;

import com.securewealth.dto.response.WealthScoreResponse;
import com.securewealth.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@Tag(name = "Gamification", description = "Endpoints for scores and achievements")
public class GamificationController {

    private final GamificationService gamificationService;

    @Operation(summary = "Get detailed wealth score breakdown")
    @GetMapping("/score")
    public ResponseEntity<WealthScoreResponse> getScore(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(gamificationService.getWealthScore(userId));
    }

    @Operation(summary = "Get user achievements")
    @GetMapping("/achievements")
    public ResponseEntity<List<Map<String, Object>>> getAchievements() {
        // Mock achievements for immediate UI rendering
        return ResponseEntity.ok(List.of(
            Map.of("name", "First Goal Created", "description", "You've taken the first step!", "isUnlocked", true, "unlockedAt", LocalDateTime.now().minusDays(10)),
            Map.of("name", "Consistent Saver", "description", "Save 20% of income for 3 months.", "isUnlocked", false, "unlockedAt", null),
            Map.of("name", "Security Champion", "description", "0 blocked actions this month.", "isUnlocked", true, "unlockedAt", LocalDateTime.now())
        ));
    }
}
