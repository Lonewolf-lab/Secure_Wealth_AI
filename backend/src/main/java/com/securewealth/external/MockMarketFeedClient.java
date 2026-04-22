package com.securewealth.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
@Slf4j
@RequiredArgsConstructor
public class MockMarketFeedClient {

    private final ObjectMapper objectMapper;
    private JsonNode marketData;

    @PostConstruct
    public void init() {
        try {
            InputStream is = new ClassPathResource("mock-data/market-feed.json").getInputStream();
            marketData = objectMapper.readTree(is);
            log.info("Loaded mock market feed");
        } catch (Exception e) {
            log.error("Failed to load mock market feed", e);
        }
    }

    public JsonNode getCurrentMarketData() {
        // Simulated ±0.5% random variation could be applied here if desired.
        // For simplicity, returning the exact static mock data on each call.
        return marketData;
    }
}
