package com.voiceapp.service;

import com.voiceapp.model.ActionResult;
import com.voiceapp.model.ToolCall;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for executing tool calls and converting them into actions
 * Phase 4: Tool execution layer
 */
@Slf4j
@Service
public class ToolExecutor {

    /**
     * Execute a tool call and return an ActionResult
     */
    public Mono<ActionResult> execute(ToolCall toolCall) {
        if (toolCall == null || toolCall.getTool() == null) {
            return Mono.just(createErrorAction("Invalid tool call"));
        }

        log.info("⚙️ Executing tool: {} with params: {}", toolCall.getTool(), toolCall.getParams());

        return switch (toolCall.getTool().toLowerCase()) {
            case "navigate" -> executeNavigate(toolCall);
            case "save_form" -> executeSaveForm(toolCall);
            case "trigger_email" -> executeTriggerEmail(toolCall);
            case "submit_form" -> executeSubmitForm(toolCall);
            case "unknown" -> executeUnknown(toolCall);
            default -> Mono.just(createErrorAction("Unknown tool: " + toolCall.getTool()));
        };
    }

    /**
     * Execute navigate tool
     */
    private Mono<ActionResult> executeNavigate(ToolCall toolCall) {
        Map<String, Object> params = toolCall.getParams();
        if (params == null || !params.containsKey("page")) {
            return Mono.just(createErrorAction("Missing 'page' parameter for navigate"));
        }

        String page = params.get("page").toString();
        log.info("🧭 Navigate to page: {}", page);

        return Mono.just(ActionResult.builder()
            .action("NAVIGATE")
            .target(page)
            .success(true)
            .build());
    }

    /**
     * Execute save_form tool
     */
    private Mono<ActionResult> executeSaveForm(ToolCall toolCall) {
        Map<String, Object> params = toolCall.getParams();
        if (params == null || !params.containsKey("field") || !params.containsKey("value")) {
            return Mono.just(createErrorAction("Missing 'field' or 'value' parameter for save_form"));
        }

        String field = params.get("field").toString();
        String value = params.get("value").toString();
        log.info("💾 Save form field: {} = {}", field, value);

        return Mono.just(ActionResult.builder()
            .action("SAVE_FORM_FIELD")
            .field(field)
            .value(value)
            .success(true)
            .build());
    }

    /**
     * Execute trigger_email tool
     */
    private Mono<ActionResult> executeTriggerEmail(ToolCall toolCall) {
        Map<String, Object> params = toolCall.getParams();
        if (params == null) {
            params = new HashMap<>();
        }

        String subject = params.getOrDefault("subject", "Email notification").toString();
        String body = params.getOrDefault("body", "").toString();
        log.info("📧 Trigger email - Subject: {}, Body: {}", subject, body);

        // In a real implementation, this would send an email
        // For now, we just create a backend task action
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("subject", subject);
        metadata.put("body", body);
        metadata.put("status", "queued");

        return Mono.just(ActionResult.builder()
            .action("BACKEND_TASK")
            .taskId("email_" + System.currentTimeMillis())
            .metadata(metadata)
            .success(true)
            .build());
    }

    /**
     * Execute submit_form tool
     */
    private Mono<ActionResult> executeSubmitForm(ToolCall toolCall) {
        log.info("📤 Submit form");

        return Mono.just(ActionResult.builder()
            .action("SUBMIT_FORM")
            .success(true)
            .build());
    }

    /**
     * Execute unknown tool
     */
    private Mono<ActionResult> executeUnknown(ToolCall toolCall) {
        log.warn("❓ Unknown intent");

        Map<String, Object> metadata = new HashMap<>();
        if (toolCall.getParams() != null && toolCall.getParams().containsKey("text")) {
            metadata.put("original_text", toolCall.getParams().get("text"));
        }

        return Mono.just(ActionResult.builder()
            .action("UNKNOWN")
            .success(false)
            .metadata(metadata)
            .error("Could not interpret the command")
            .build());
    }

    /**
     * Create error action
     */
    private ActionResult createErrorAction(String errorMessage) {
        log.error("❌ Tool execution error: {}", errorMessage);
        return ActionResult.builder()
            .action("ERROR")
            .success(false)
            .error(errorMessage)
            .build();
    }
}
