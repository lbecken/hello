package com.voiceapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response model from Ollama API
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OllamaResponse {
    private String model;
    private String created_at;
    private String response;
    private Boolean done;
    private Long total_duration;
    private Long load_duration;
    private Long prompt_eval_duration;
    private Long eval_duration;
}
