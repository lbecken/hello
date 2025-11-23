package com.voiceapp.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check endpoint
 */
@Slf4j
@RestController
public class HealthController {

    @GetMapping("/health")
    public Mono<Map<String, Object>> health() {
        log.info("Health check requested");
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        health.put("service", "voice-intent-backend");
        return Mono.just(health);
    }
}
