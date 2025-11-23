package com.voiceapp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

/**
 * Main Spring Boot Application for Voice Intent Backend
 * Uses WebFlux for reactive WebSocket handling and Ollama for LLM-based intent interpretation
 */
@Slf4j
@SpringBootApplication
public class VoiceIntentApplication {

    private final Environment environment;

    public VoiceIntentApplication(Environment environment) {
        this.environment = environment;
    }

    public static void main(String[] args) {
        SpringApplication.run(VoiceIntentApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = environment.getProperty("server.port", "8082");
        String address = environment.getProperty("server.address", "0.0.0.0");

        log.info("");
        log.info("═══════════════════════════════════════════════════════");
        log.info("🚀 Voice Intent Backend Started Successfully!");
        log.info("═══════════════════════════════════════════════════════");
        log.info("📡 WebSocket Endpoint: ws://{}:{}/ws/intent", address, port);
        log.info("🔗 Local: ws://localhost:{}/ws/intent", port);
        log.info("🌐 Network: ws://{}:{}/ws/intent", address, port);
        log.info("═══════════════════════════════════════════════════════");
        log.info("");
    }
}
