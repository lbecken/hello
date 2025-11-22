package com.voiceapp.service;

import com.voiceapp.model.OllamaRequest;
import com.voiceapp.model.OllamaResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Client for communicating with local Ollama API
 */
@Slf4j
@Service
public class OllamaClient {

    private final WebClient webClient;
    private final String model;
    private final Duration timeout;

    public OllamaClient(
            @Value("${ollama.api.url:http://localhost:11434}") String ollamaUrl,
            @Value("${ollama.model:llama3.2:3b}") String model,
            @Value("${ollama.timeout:30000}") long timeoutMs) {
        this.webClient = WebClient.builder()
                .baseUrl(ollamaUrl)
                .build();
        this.model = model;
        this.timeout = Duration.ofMillis(timeoutMs);
        log.info("🤖 OllamaClient initialized with model: {}, URL: {}", model, ollamaUrl);
    }

    /**
     * Generate a response from Ollama with the given prompt
     */
    public Mono<String> generate(String prompt) {
        OllamaRequest request = OllamaRequest.builder()
                .model(model)
                .prompt(prompt)
                .stream(false)
                .format("json")  // Force JSON output
                .options(OllamaRequest.OllamaOptions.builder()
                        .temperature(0.1)  // Low temperature for more deterministic output
                        .num_predict(200)  // Limit response length
                        .build())
                .build();

        log.debug("📤 Sending request to Ollama: {}", prompt);

        return webClient.post()
                .uri("/api/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OllamaResponse.class)
                .timeout(timeout)
                .map(response -> {
                    log.debug("📥 Received response from Ollama: {}", response.getResponse());
                    return response.getResponse();
                })
                .doOnError(error -> log.error("❌ Ollama API error: {}", error.getMessage()))
                .onErrorResume(error -> {
                    log.error("Failed to get response from Ollama", error);
                    return Mono.just("{\"tool\":\"error\",\"params\":{\"message\":\"LLM unavailable\"}}");
                });
    }

    /**
     * Check if Ollama is available
     */
    public Mono<Boolean> isAvailable() {
        return webClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> true)
                .timeout(Duration.ofSeconds(5))
                .onErrorReturn(false);
    }
}
