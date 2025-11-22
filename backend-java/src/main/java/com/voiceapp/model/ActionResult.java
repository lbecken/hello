package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Represents the result of an executed action
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionResult {
    private String action;               // Action type: "NAVIGATE", "SAVE_FORM_FIELD", "BACKEND_TASK"
    private String target;               // Target for navigation
    private String field;                // Field name for form operations
    private String value;                // Value for form operations
    private String taskId;               // Task ID for backend tasks
    private Map<String, Object> metadata; // Additional metadata
    private Boolean success;             // Whether the action succeeded
    private String error;                // Error message if any
}
