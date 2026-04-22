package com.securewealth.middleware;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securewealth.dto.request.WealthActionRequest;
import com.securewealth.dto.response.WPRSResponse;
import com.securewealth.model.enums.EventDecision;
import com.securewealth.service.security.WPRSService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.math.BigDecimal;

@Component
@Slf4j
@RequiredArgsConstructor
public class WealthActionInterceptor implements HandlerInterceptor {

    private final WPRSService wprsService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        // This interceptor only applies to POST/PUT requests handled by specific config mappings
        if (!request.getMethod().equalsIgnoreCase("POST")) {
            return true;
        }

        Long userId = (Long) request.getAttribute("X-User-Id");
        if (userId == null) return true; // Let standard auth filter handle 401s
        
        String deviceId = request.getHeader("X-Device-ID");
        
        // To read request body in interceptor, we need cached wrapper (handled by filter usually)
        // For hackathon simplicity, we might read specific headers or params, or if using wrapper:
        BigDecimal amount = BigDecimal.ZERO;
        String actionType = "INVESTMENT_ACTION";
        
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            byte[] body = wrapper.getContentAsByteArray();
            try {
                WealthActionRequest actionRequest = objectMapper.readValue(body, WealthActionRequest.class);
                amount = actionRequest.getAmount() != null ? actionRequest.getAmount() : BigDecimal.ZERO;
                actionType = actionRequest.getActionType() != null ? actionRequest.getActionType() : actionType;
            } catch (Exception ignored) { }
        }

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
