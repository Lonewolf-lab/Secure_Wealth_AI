package com.securewealth.service;

import com.securewealth.dto.request.ChatRequest;
import com.securewealth.dto.response.ChatResponse;
import com.securewealth.external.MLServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final MLServiceClient mlServiceClient;

    public ChatResponse sendMessage(ChatRequest request) {
        return mlServiceClient.chat(request);
    }
}
