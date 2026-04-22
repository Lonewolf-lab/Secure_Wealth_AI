package com.securewealth.controller;

import com.securewealth.dto.request.ChatRequest;
import com.securewealth.dto.response.ChatResponse;
import com.securewealth.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Endpoints for the interactive AI assistant")
public class ChatController {

    private final ChatService chatService;

    @Operation(summary = "Send a message to the Wealth Assistant")
    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(@RequestAttribute("X-User-Id") Long userId,
                                                    @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(request));
    }
}
