package com.voiceapp.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceapp.model.ActionResult;
import com.voiceapp.model.IntentRequest;
import com.voiceapp.model.IntentResponse;
import com.voiceapp.model.ToolCall;
import com.voiceapp.service.ContextService;
import com.voiceapp.service.IntentService;
import com.voiceapp.service.ToolExecutor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Reactive WebSocket handler for intent interpretation
 * Phase 6: Integrated with context-aware interpretation
 */
@Slf4j
@Component
public class IntentWebSocketHandler implements WebSocketHandler {

    private final ObjectMapper objectMapper;
    private final IntentService intentService;
    private final ToolExecutor toolExecutor;
    private final ContextService contextService;
    private final AtomicInteger connectionCounter = new AtomicInteger(0);

    public IntentWebSocketHandler(ObjectMapper objectMapper, IntentService intentService,
                                   ToolExecutor toolExecutor, ContextService contextService) {
        this.objectMapper = objectMapper;
        this.intentService = intentService;
        this.toolExecutor = toolExecutor;
        this.contextService = contextService;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        int clientId = connectionCounter.incrementAndGet();
        log.info("✅ Client #{} connected: {}", clientId, session.getId());

        // Send welcome message
        Mono<Void> welcomeMessage = session.send(
            Mono.just(createWelcomeMessage(session))
        );

        // Handle incoming messages
        Mono<Void> messageHandler = session.receive()
            .map(WebSocketMessage::getPayloadAsText)
            .flatMap(text -> handleMessage(session, clientId, text))
            .flatMap(response -> session.send(Mono.just(session.textMessage(response))))
            .then();

        // Combine welcome message and message handler
        return welcomeMessage.then(messageHandler)
            .doOnTerminate(() -> log.info("❌ Client #{} disconnected: {}", clientId, session.getId()))
            .doOnError(error -> log.error("⚠️ Client #{} error: {}", clientId, error.getMessage()));
    }

    /**
     * Create welcome message for new connections
     */
    private String createWelcomeMessage(WebSocketSession session) {
        try {
            IntentResponse welcome = IntentResponse.builder()
                .type("system")
                .message("Connected to Voice Intent Interpreter (Java/Spring Boot)")
                .timestamp(Instant.now().toString())
                .build();
            return objectMapper.writeValueAsString(welcome);
        } catch (JsonProcessingException e) {
            log.error("Error creating welcome message", e);
            return "{\"type\":\"error\",\"message\":\"Failed to create welcome message\"}";
        }
    }

    /**
     * Handle incoming message
     * Phase 3: Process through IntentService
     */
    private Mono<String> handleMessage(WebSocketSession session, int clientId, String text) {
        return Mono.fromCallable(() -> {
            try {
                log.info("📨 Client #{} message: {}", clientId, text);
                return objectMapper.readValue(text, IntentRequest.class);
            } catch (JsonProcessingException e) {
                log.error("Error parsing message from client #{}: {}", clientId, e.getMessage());
                return null;
            }
        })
        .flatMap(request -> {
            if (request == null) {
                return createErrorResponse("Invalid message format");
            }

            // Handle different message types
            return switch (request.getType() != null ? request.getType() : "stt") {
                case "ping" -> createPongResponse();
                case "stt" -> handleSTT(session, clientId, request);
                default -> createErrorResponse("Unknown message type: " + request.getType());
            };
        });
    }

    /**
     * Handle STT text and interpret intent
     */
    private Mono<String> handleSTT(WebSocketSession session, int clientId, IntentRequest request) {
        String text = request.getText();

        if (text == null || text.trim().isEmpty()) {
            return createErrorResponse("Empty STT text");
        }

        // Handle partial results
        if (Boolean.TRUE.equals(request.getPartial())) {
            return createPartialResponse(text);
        }

        log.info("🎤 STT Text (final): \"{}\"", text);

        long startTime = System.currentTimeMillis();
        String sessionId = session.getId();

        // Interpret intent using LLM with context, then execute the tool
        return intentService.interpret(text, sessionId)
            .flatMap(toolCall -> {
                long interpretTime = System.currentTimeMillis() - startTime;

                // Execute the tool and return action result
                return toolExecutor.execute(toolCall)
                    .flatMap(actionResult -> {
                        long totalTime = System.currentTimeMillis() - startTime;

                        // Update context with this interaction
                        contextService.updateContext(sessionId, text,
                            toolCall.getTool(), actionResult.getAction());

                        return createActionResultResponse(toolCall, actionResult, interpretTime, totalTime);
                    });
            })
            .doOnNext(response -> log.info("📤 Sending response to client #{}", clientId))
            .onErrorResume(error -> {
                log.error("❌ Error processing STT from client #{}: {}", clientId, error.getMessage());
                return createErrorResponse("Failed to process STT: " + error.getMessage());
            });
    }

    /**
     * Create action result response from ToolCall and ActionResult
     */
    private Mono<String> createActionResultResponse(ToolCall toolCall, ActionResult actionResult,
                                                     long interpretTime, long totalTime) {
        return Mono.fromCallable(() -> {
            // Create a response that includes both the intent and the action result
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("type", "action_result");
            responseData.put("intent", toolCall.getTool());
            responseData.put("intentParams", toolCall.getParams());
            responseData.put("action", actionResult.getAction());
            responseData.put("target", actionResult.getTarget());
            responseData.put("field", actionResult.getField());
            responseData.put("value", actionResult.getValue());
            responseData.put("taskId", actionResult.getTaskId());
            responseData.put("metadata", actionResult.getMetadata());
            responseData.put("success", actionResult.getSuccess());
            responseData.put("error", actionResult.getError());
            responseData.put("interpretTime", interpretTime);
            responseData.put("totalTime", totalTime);
            responseData.put("timestamp", Instant.now().toString());

            return objectMapper.writeValueAsString(responseData);
        });
    }

    /**
     * Create partial response
     */
    private Mono<String> createPartialResponse(String text) {
        return Mono.fromCallable(() -> {
            IntentResponse response = IntentResponse.builder()
                .type("partial")
                .message(text)
                .timestamp(Instant.now().toString())
                .build();
            return objectMapper.writeValueAsString(response);
        });
    }

    /**
     * Create pong response
     */
    private Mono<String> createPongResponse() {
        return Mono.fromCallable(() -> {
            IntentResponse response = IntentResponse.builder()
                .type("pong")
                .timestamp(Instant.now().toString())
                .build();
            return objectMapper.writeValueAsString(response);
        });
    }

    /**
     * Create error response
     */
    private Mono<String> createErrorResponse(String message) {
        return Mono.fromCallable(() -> {
            IntentResponse response = IntentResponse.builder()
                .type("error")
                .message(message)
                .timestamp(Instant.now().toString())
                .build();
            return objectMapper.writeValueAsString(response);
        })
        .onErrorReturn("{\"type\":\"error\",\"message\":\"Failed to create error response\"}");
    }
}
