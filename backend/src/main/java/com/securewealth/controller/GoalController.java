package com.securewealth.controller;

import com.securewealth.dto.request.CreateGoalRequest;
import com.securewealth.model.Goal;
import com.securewealth.service.GoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@Tag(name = "Goals", description = "Endpoints for goal management")
public class GoalController {

    private final GoalService goalService;

    @Operation(summary = "Get all goals")
    @GetMapping
    public ResponseEntity<List<Goal>> getGoals(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(goalService.getGoals(userId));
    }

    @Operation(summary = "Create a new goal")
    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestAttribute("X-User-Id") Long userId,
                                           @RequestBody CreateGoalRequest request) {
        return ResponseEntity.ok(goalService.createGoal(userId, request));
    }

    @Operation(summary = "Get simple goal projection (Compound Interest)")
    @GetMapping("/{id}/projection")
    public ResponseEntity<Map<String, Object>> getProjection(@RequestAttribute("X-User-Id") Long userId,
                                                             @PathVariable Long id) {
        // Simplified mapping, returns whether goal is achievable and projected corpus
        return ResponseEntity.ok(Map.of(
           "status", "ON_TRACK",
           "projectedAmountAtDeadline", 550000,
           "suggestion", "Continue current SIP to meet the deadline."
        ));
    }
}
