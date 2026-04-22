package com.securewealth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.securewealth.dto.response.AdvisorRecommendation;
import com.securewealth.external.MLServiceClient;
import com.securewealth.external.MockMarketFeedClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdvisorService {

    private final MLServiceClient mlServiceClient;
    private final MockMarketFeedClient marketFeedClient;

    public List<AdvisorRecommendation> getRecommendations(Long userId) {
        return mlServiceClient.getRecommendations(userId);
    }

    public JsonNode getMarketInsights() {
        return marketFeedClient.getCurrentMarketData();
    }
}
