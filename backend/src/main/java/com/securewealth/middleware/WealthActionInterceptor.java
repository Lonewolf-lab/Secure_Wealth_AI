package com.securewealth.middleware;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securewealth.dto.response.WPRSResponse;
import com.securewealth.model.enums.EventDecision;
import com.securewealth.service.security.WPRSService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.math.BigDecimal;

@Component
@Slf4j
@RequiredArgsConstructor
public class WealthActionInterceptor implements HandlerInterceptor {

    private final WPRSService wprsService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        if (!request.getMethod().equalsIgnoreCase("POST")) {
            return true;
        }

        Long userId = (Long) request.getAttribute("X-User-Id");
        if (userId == null) return true;

        String deviceId = request.getHeader("X-Device-ID");

        // Read amount and actionType from headers to avoid consuming request body
        BigDecimal amount = BigDecimal.ZERO;
        String actionType = "INVESTMENT_ACTION";

        String amountHeader = request.getHeader("X-Action-Amount");
        String actionTypeHeader = request.getHeader("X-Action-Type");

        if (amountHeader != null) {
            try {
                amount = new BigDecimal(amountHeader);
            } catch (Exception e) {
                log.warn("Invalid X-Action-Amount header: {}", amountHeader);
            }
        }

        if (actionTypeHeader != null) {
            actionType = actionTypeHeader;
        }

        log.info("Interceptor read: actionType={}, amount={}", actionType, amount);

        WPRSResponse wprsResponse = wprsService.evaluate(userId, actionType, amount, deviceId, request);

        if (wprsResponse.getDecision().equals(EventDecision.BLOCK.name())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(objectMapper.writeValueAsString(wprsResponse));
            return false;
        }

        if (wprsResponse.getDecision().equals(EventDecision.WARN.name())) {
            request.setAttribute("wprsResponse", wprsResponse);
        }

        return true;
    }
}