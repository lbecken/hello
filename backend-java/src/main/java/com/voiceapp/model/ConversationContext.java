package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Conversation context for a session
 * Stores recent interactions for context-aware interpretation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationContext {
    private String sessionId;
    private List<ConversationTurn> turns;
    private Instant createdAt;
    private Instant lastAccessedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationTurn {
        private String userText;
        private String intent;
        private String action;
        private Instant timestamp;
    }

    /**
     * Add a new turn to the context
     */
    public void addTurn(String userText, String intent, String action) {
        if (turns == null) {
            turns = new ArrayList<>();
        }

        ConversationTurn turn = ConversationTurn.builder()
            .userText(userText)
            .intent(intent)
            .action(action)
            .timestamp(Instant.now())
            .build();

        turns.add(turn);

        // Keep only the last 5 turns
        if (turns.size() > 5) {
            turns.remove(0);
        }

        lastAccessedAt = Instant.now();
    }

    /**
     * Get context as a string for the LLM prompt
     */
    public String getContextString() {
        if (turns == null || turns.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder("\n\nRecent conversation history:\n");
        for (ConversationTurn turn : turns) {
            sb.append("User: ").append(turn.getUserText())
              .append(" → Intent: ").append(turn.getIntent())
              .append(" → Action: ").append(turn.getAction())
              .append("\n");
        }
        return sb.toString();
    }
}
