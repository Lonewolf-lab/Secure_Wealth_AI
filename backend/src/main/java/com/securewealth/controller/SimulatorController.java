package com.securewealth.controller;

import com.securewealth.dto.request.SimulateRequest;
import com.securewealth.dto.response.SimulationResult;
import com.securewealth.service.SimulatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulator")
@RequiredArgsConstructor
@Tag(name = "Simulator", description = "Endpoints for Monte Carlo and wealth simulations")
public class SimulatorController {

    private final SimulatorService simulatorService;

    @Operation(summary = "Run a what-if Monte Carlo simulation")
    @PostMapping("/what-if")
    public ResponseEntity<SimulationResult> simulate(@RequestAttribute("X-User-Id") Long userId,
                                                     @RequestBody SimulateRequest request) {
        return ResponseEntity.ok(simulatorService.runMonteCarlo(request, userId));
    }
}
