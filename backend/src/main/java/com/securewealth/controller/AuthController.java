package com.securewealth.controller;

import com.securewealth.dto.request.LoginRequest;
import com.securewealth.dto.request.RegisterRequest;
import com.securewealth.dto.response.AuthResponse;
import com.securewealth.service.AuthService;
import com.securewealth.service.security.VelocityTrackerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for login and registration")
public class AuthController {

    private final AuthService authService;
    private final VelocityTrackerService velocityTrackerService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Login an existing user")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @Operation(summary = "Logout user")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId != null) {
            // In a fully stateless app, frontend deletes token.
            // But we simulate clearing velocity key from Redis.
            velocityTrackerService.clearLoginTimestamp(userId);
        }
        return ResponseEntity.ok().build();
    }
}
