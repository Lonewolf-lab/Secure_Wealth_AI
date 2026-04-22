package com.securewealth.controller;

import com.securewealth.dto.request.OTPVerifyRequest;
import com.securewealth.model.SecurityEvent;
import com.securewealth.model.TrustedDevice;
import com.securewealth.model.User;
import com.securewealth.repository.SecurityEventRepository;
import com.securewealth.repository.TrustedDeviceRepository;
import com.securewealth.repository.UserRepository;
import com.securewealth.service.security.OTPSimulationService;
import com.securewealth.service.security.SecurityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
@Tag(name = "Security", description = "Endpoints for WPRS, Devices, OTP, and Audit Logs")
public class SecurityController {

    private final SecurityLogService securityLogService;
    private final SecurityEventRepository securityEventRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final OTPSimulationService otpSimulationService;

    private final UserRepository userRepository;

    public SecurityController(SecurityLogService securityLogService,
                              SecurityEventRepository securityEventRepository,
                              TrustedDeviceRepository trustedDeviceRepository,
                              OTPSimulationService otpSimulationService,
                              UserRepository userRepository) {
        this.securityLogService = securityLogService;
        this.securityEventRepository = securityEventRepository;
        this.trustedDeviceRepository = trustedDeviceRepository;
        this.otpSimulationService = otpSimulationService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Get the latest WPRS session data")
    @GetMapping("/wprs")
    public ResponseEntity<SecurityEvent> getLatestWprs(@RequestAttribute("X-User-Id") Long userId) {
        var events = securityEventRepository.findByUserIdOrderByTimestampDesc(userId);
        return events.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(events.get(0));
    }

    @Operation(summary = "List assigned trusted devices")
    @GetMapping("/devices")
    public ResponseEntity<List<TrustedDevice>> getDevices(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(trustedDeviceRepository.findByUserId(userId));
    }

    @Operation(summary = "Register device as trusted")
    @PostMapping("/trust-device")
    public ResponseEntity<Void> trustDevice(@RequestAttribute("X-User-Id") Long userId,
                                            @RequestParam String deviceId,
                                            @RequestParam String deviceName) {
        User user = userRepository.findById(userId).orElseThrow();
        TrustedDevice device = TrustedDevice.builder()
                .user(user)
                .deviceId(deviceId)
                .deviceName(deviceName)
                .isTrusted(true)
                .registeredAt(LocalDateTime.now())
                .lastSeen(LocalDateTime.now())
                .build();
        trustedDeviceRepository.save(device);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get paginated security audit log")
    @GetMapping("/log")
    public ResponseEntity<Page<SecurityEvent>> getAuditLog(@RequestAttribute("X-User-Id") Long userId,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(securityLogService.getAuditLogs(userId, PageRequest.of(page, size)));
    }

    @Operation(summary = "Generate simulated verification OTP")
    @PostMapping("/otp/generate")
    public ResponseEntity<Map<String, String>> generateOtp(@RequestAttribute("X-User-Id") Long userId,
                                                           @RequestParam String actionType) {
        String msg = otpSimulationService.generateOTP(userId, actionType);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @Operation(summary = "Verify OTP")
    @PostMapping("/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestAttribute("X-User-Id") Long userId,
                                                         @RequestBody OTPVerifyRequest request) {
        boolean isValid = otpSimulationService.verifyOTP(userId, request.getOtp(), request.getActionType());
        return ResponseEntity.ok(Map.of("success", isValid));
    }
}
