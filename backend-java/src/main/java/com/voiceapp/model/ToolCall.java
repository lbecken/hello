package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Represents a tool call from the LLM
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToolCall {
    private String tool;                 // Tool name: "navigate", "save_form", "trigger_email"
    private Map<String, Object> params;  // Tool parameters
}
