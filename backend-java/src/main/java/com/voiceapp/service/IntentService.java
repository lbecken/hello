package com.voiceapp.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceapp.model.ToolCall;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Service for interpreting user intent using Ollama LLM with tool calling
 */
@Slf4j
@Service
public class IntentService {

    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper;
    private final ValidationService validationService;
    private final ContextService contextService;

    // Tool calling schema prompt
    private static final String SYSTEM_PROMPT = """
            You are a voice command interpreter. Your job is to analyze spoken text and convert it into structured tool calls.

            Available tools:

            1. navigate:
               description: Navigate to a different page in the application
               parameters: { "page": "string" }
               examples: "open settings", "go to login", "show dashboard"

            2. save_form:
               description: Save a form field value
               parameters: { "field": "string", "value": "string" }
               examples: "save email john@example.com", "set username to alice", "my name is Bob"

            3. trigger_email:
               description: Send a notification email
               parameters: { "subject": "string", "body": "string" }
               examples: "send email to HR", "email support about login issue"

            4. submit_form:
               description: Submit the current form
               parameters: {}
               examples: "submit the form", "send it", "submit"

            5. unknown:
               description: Use when the intent is unclear
               parameters: { "text": "original text" }

            CRITICAL RULES:
            - Your response MUST be valid JSON
            - Your response MUST match this exact structure:
              {
                "tool": "tool_name",
                "params": { "key": "value" }
              }
            - Do NOT include any explanations, markdown, or extra text
            - Choose the MOST appropriate tool based on the user's intent
            - If uncertain, use the "unknown" tool

            Examples:

            Input: "open settings page"
            Output: {"tool":"navigate","params":{"page":"settings"}}

            Input: "save email john@example.com"
            Output: {"tool":"save_form","params":{"field":"email","value":"john@example.com"}}

            Input: "send email to HR about vacation"
            Output: {"tool":"trigger_email","params":{"subject":"Vacation request","body":"Request for vacation time"}}

            Input: "submit the form"
            Output: {"tool":"submit_form","params":{}}

            Now interpret this command:
            """;

    public IntentService(OllamaClient ollamaClient, ObjectMapper objectMapper,
                         ValidationService validationService, ContextService contextService) {
        this.ollamaClient = ollamaClient;
        this.objectMapper = objectMapper;
        this.validationService = validationService;
        this.contextService = contextService;
    }

    /**
     * Interpret user text and return a ToolCall
     * @param text The user text to interpret
     * @param sessionId Optional session ID for context-aware interpretation
     */
    public Mono<ToolCall> interpret(String text, String sessionId) {
        if (text == null || text.trim().isEmpty()) {
            return Mono.just(new ToolCall("unknown", null));
        }

        // Sanitize input
        String sanitized = validationService.sanitizeText(text);
        if (sanitized.isEmpty()) {
            log.warn("⚠️ Text sanitization resulted in empty string");
            return Mono.just(new ToolCall("unknown", null));
        }

        // Build prompt with optional context
        String contextStr = "";
        if (sessionId != null && !sessionId.isEmpty()) {
            var context = contextService.getContext(sessionId);
            contextStr = context.getContextString();
        }

        String prompt = SYSTEM_PROMPT + contextStr + "\n\nUser command: \"" + sanitized + "\"\n\nYour JSON response:";

        return ollamaClient.generate(prompt)
                .map(this::parseToolCall)
                .map(toolCall -> {
                    // Validate the tool call
                    if (!validationService.isValidToolCall(toolCall)) {
                        log.warn("⚠️ Invalid tool call, returning unknown");
                        return new ToolCall("unknown", null);
                    }
                    return toolCall;
                })
                .doOnNext(toolCall -> log.info("✨ Interpreted intent: {} with params: {}",
                    toolCall.getTool(), toolCall.getParams()));
    }

    /**
     * Interpret user text without context (backward compatibility)
     */
    public Mono<ToolCall> interpret(String text) {
        return interpret(text, null);
    }

    /**
     * Parse LLM response into ToolCall
     */
    private ToolCall parseToolCall(String response) {
        try {
            // Clean the response - remove markdown code blocks if present
            String cleaned = response.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            }
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            // Parse JSON
            ToolCall toolCall = objectMapper.readValue(cleaned, ToolCall.class);

            // Validate
            if (toolCall.getTool() == null || toolCall.getTool().isEmpty()) {
                log.warn("⚠️ Invalid tool call (missing tool name): {}", cleaned);
                return new ToolCall("unknown", null);
            }

            return toolCall;
        } catch (JsonProcessingException e) {
            log.error("❌ Failed to parse LLM response as JSON: {}", response, e);
            return new ToolCall("unknown", null);
        }
    }
}
