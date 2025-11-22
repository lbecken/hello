package com.voiceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application for Voice Intent Backend
 * Uses WebFlux for reactive WebSocket handling and Ollama for LLM-based intent interpretation
 */
@SpringBootApplication
public class VoiceIntentApplication {

    public static void main(String[] args) {
        SpringApplication.run(VoiceIntentApplication.class, args);
    }
}
