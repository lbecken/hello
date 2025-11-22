package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents an incoming intent request from the client
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IntentRequest {
    private String type;      // Message type: "stt", "ping", "get_state"
    private String text;      // STT text to interpret
    private Boolean partial;  // Whether this is a partial result
}
