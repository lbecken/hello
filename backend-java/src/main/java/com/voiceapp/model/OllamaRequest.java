package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request model for Ollama API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OllamaRequest {
    private String model;
    private String prompt;
    private Boolean stream;
    private String format;  // "json" to force JSON output
    private OllamaOptions options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OllamaOptions {
        private Double temperature;
        private Integer num_predict;
    }
}
