package com.voiceapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceapp.model.ToolCall;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Service for validating LLM responses and tool calls
 * Phase 5: Validation and error handling
 */
@Slf4j
@Service
public class ValidationService {

    private static final Set<String> VALID_TOOLS = new HashSet<>(Arrays.asList(
        "navigate", "save_form", "trigger_email", "submit_form", "unknown"
    ));

    private static final int MAX_TEXT_LENGTH = 1000;
    private static final int MAX_PARAM_LENGTH = 500;

    private final ObjectMapper objectMapper;

    public ValidationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Validate tool call
     */
    public boolean isValidToolCall(ToolCall toolCall) {
        if (toolCall == null) {
            log.warn("⚠️ Validation failed: ToolCall is null");
            return false;
        }

        if (toolCall.getTool() == null || toolCall.getTool().isEmpty()) {
            log.warn("⚠️ Validation failed: Tool name is null or empty");
            return false;
        }

        if (!VALID_TOOLS.contains(toolCall.getTool().toLowerCase())) {
            log.warn("⚠️ Validation failed: Unknown tool '{}'", toolCall.getTool());
            // Still return true, as we handle unknown tools gracefully
            return true;
        }

        return validateToolParameters(toolCall);
    }

    /**
     * Validate tool parameters
     */
    private boolean validateToolParameters(ToolCall toolCall) {
        String tool = toolCall.getTool().toLowerCase();
        Map<String, Object> params = toolCall.getParams();

        return switch (tool) {
            case "navigate" -> validateNavigateParams(params);
            case "save_form" -> validateSaveFormParams(params);
            case "trigger_email" -> validateTriggerEmailParams(params);
            case "submit_form" -> true; // No params required
            case "unknown" -> true; // No validation needed
            default -> true;
        };
    }

    /**
     * Validate navigate parameters
     */
    private boolean validateNavigateParams(Map<String, Object> params) {
        if (params == null || !params.containsKey("page")) {
            log.warn("⚠️ Navigate validation failed: Missing 'page' parameter");
            return false;
        }

        String page = params.get("page").toString();
        if (page.isEmpty() || page.length() > MAX_PARAM_LENGTH) {
            log.warn("⚠️ Navigate validation failed: Invalid page value");
            return false;
        }

        return true;
    }

    /**
     * Validate save_form parameters
     */
    private boolean validateSaveFormParams(Map<String, Object> params) {
        if (params == null || !params.containsKey("field") || !params.containsKey("value")) {
            log.warn("⚠️ Save form validation failed: Missing 'field' or 'value' parameter");
            return false;
        }

        String field = params.get("field").toString();
        String value = params.get("value").toString();

        if (field.isEmpty() || field.length() > MAX_PARAM_LENGTH ||
            value.isEmpty() || value.length() > MAX_PARAM_LENGTH) {
            log.warn("⚠️ Save form validation failed: Invalid field or value");
            return false;
        }

        return true;
    }

    /**
     * Validate trigger_email parameters
     */
    private boolean validateTriggerEmailParams(Map<String, Object> params) {
        if (params == null) {
            return true; // Params are optional for email
        }

        if (params.containsKey("subject")) {
            String subject = params.get("subject").toString();
            if (subject.length() > MAX_PARAM_LENGTH) {
                log.warn("⚠️ Email validation failed: Subject too long");
                return false;
            }
        }

        if (params.containsKey("body")) {
            String body = params.get("body").toString();
            if (body.length() > MAX_TEXT_LENGTH) {
                log.warn("⚠️ Email validation failed: Body too long");
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitize text input
     */
    public String sanitizeText(String text) {
        if (text == null) {
            return "";
        }

        // Remove control characters and trim
        String sanitized = text.replaceAll("[\\p{Cntrl}&&[^\n\r\t]]", "").trim();

        // Limit length
        if (sanitized.length() > MAX_TEXT_LENGTH) {
            log.warn("⚠️ Text truncated from {} to {} characters", sanitized.length(), MAX_TEXT_LENGTH);
            sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
        }

        return sanitized;
    }

    /**
     * Check if JSON string is valid
     */
    public boolean isValidJson(String json) {
        try {
            objectMapper.readTree(json);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ Invalid JSON: {}", e.getMessage());
            return false;
        }
    }
}
