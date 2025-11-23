package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Represents a response containing interpreted intent
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentResponse {
    private String type;                 // Response type: "intent", "error", "action_result"
    private String intent;               // The interpreted intent
    private Map<String, Object> params;  // Intent parameters
    private String message;              // Optional message
    private String error;                // Error message if any
    private Long processingTime;         // Processing time in milliseconds
    private String timestamp;            // ISO timestamp

    public IntentResponse(String type, String message) {
        this.type = type;
        this.message = message;
        this.timestamp = Instant.now().toString();
    }
}
