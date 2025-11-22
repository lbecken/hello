package com.voiceapp.service;

import com.voiceapp.model.ConversationContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing conversation context
 * Phase 6: Stateful context for multi-step commands
 */
@Slf4j
@Service
public class ContextService {

    private final Map<String, ConversationContext> contexts = new ConcurrentHashMap<>();
    private static final Duration CONTEXT_TIMEOUT = Duration.ofMinutes(30);

    /**
     * Get or create context for a session
     */
    public ConversationContext getContext(String sessionId) {
        cleanupExpiredContexts();

        return contexts.computeIfAbsent(sessionId, id -> {
            log.info("🆕 Creating new context for session: {}", id);
            return ConversationContext.builder()
                .sessionId(id)
                .createdAt(Instant.now())
                .lastAccessedAt(Instant.now())
                .build();
        });
    }

    /**
     * Update context with a new turn
     */
    public void updateContext(String sessionId, String userText, String intent, String action) {
        ConversationContext context = getContext(sessionId);
        context.addTurn(userText, intent, action);
        log.debug("💾 Updated context for session {} (turns: {})", sessionId,
                  context.getTurns() != null ? context.getTurns().size() : 0);
    }

    /**
     * Clear context for a session
     */
    public void clearContext(String sessionId) {
        contexts.remove(sessionId);
        log.info("🗑️ Cleared context for session: {}", sessionId);
    }

    /**
     * Cleanup expired contexts
     */
    private void cleanupExpiredContexts() {
        Instant now = Instant.now();
        contexts.entrySet().removeIf(entry -> {
            boolean expired = Duration.between(entry.getValue().getLastAccessedAt(), now)
                .compareTo(CONTEXT_TIMEOUT) > 0;
            if (expired) {
                log.info("🧹 Removing expired context for session: {}", entry.getKey());
            }
            return expired;
        });
    }

    /**
     * Get number of active contexts
     */
    public int getActiveContextCount() {
        cleanupExpiredContexts();
        return contexts.size();
    }
}
