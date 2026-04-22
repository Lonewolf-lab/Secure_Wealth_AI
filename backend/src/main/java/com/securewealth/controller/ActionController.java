package com.securewealth.controller;

import com.securewealth.dto.request.WealthActionRequest;
import com.securewealth.dto.response.WPRSResponse;
import com.securewealth.service.ActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/actions")
@RequiredArgsConstructor
@Tag(name = "Actions", description = "Endpoints for protected financial actions")
public class ActionController {

    private final ActionService actionService;

    @Operation(summary = "Execute an investment action (Protected by WPRS Interceptor)")
    @PostMapping("/invest")
    public ResponseEntity<Map<String, Object>> invest(@RequestAttribute("X-User-Id") Long userId,
                                                      @RequestBody WealthActionRequest request,
                                                      HttpServletRequest httpRequest) {
        // At this point, the Interceptor has ALREADY allowed the request to reach here!
        actionService.executeInvestment(userId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Investment executed successfully");

        // If WPRS scored it as a WARN but user was allowed to proceed (e.g. they acknowledged the warning on frontend)
        // the interceptor would put the WPRSResponse in the request object for our reference.
        WPRSResponse wprsResponse = (WPRSResponse) httpRequest.getAttribute("wprsResponse");
        if (wprsResponse != null) {
            response.put("wprsInfo", wprsResponse);
        }

        return ResponseEntity.ok(response);
    }
}
