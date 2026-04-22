package com.securewealth.service.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class VelocityTrackerService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String PFX = "velocity:";
    private static final int FAST_ACTION_THRESHOLD_SECONDS = 10;

    public void recordLogin(Long userId) {
        try {
            String key = PFX + userId;
            String timestamp = String.valueOf(System.currentTimeMillis());
            redisTemplate.opsForValue().set(key, timestamp, Duration.ofHours(1));
        } catch (Exception e) {
            log.warn("Redis unavailable for recording velocity. Ignoring error: {}", e.getMessage());
        }
    }

    public boolean isActionFast(Long userId) {
        try {
            String key = PFX + userId;
            String loginTimestampStr = redisTemplate.opsForValue().get(key);
            
            if (loginTimestampStr != null) {
                long loginTimestamp = Long.parseLong(loginTimestampStr);
                long currentTimestamp = System.currentTimeMillis();
                long diffSeconds = (currentTimestamp - loginTimestamp) / 1000;
                
                return diffSeconds < FAST_ACTION_THRESHOLD_SECONDS;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable for velocity check. Treating as safe. Error: {}", e.getMessage());
        }
        return false;
    }

    public void clearLoginTimestamp(Long userId) {
        try {
            redisTemplate.delete(PFX + userId);
        } catch (Exception e) {
            log.warn("Redis unavailable for clearing velocity. Ignoring error.");
        }
    }
}
