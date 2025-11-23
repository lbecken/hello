package com.voiceapp.config;

import com.voiceapp.controller.IntentWebSocketHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket configuration for reactive WebSocket endpoints
 */
@Slf4j
@Configuration
public class WebSocketConfig {

    @Bean
    public HandlerMapping webSocketHandlerMapping(IntentWebSocketHandler intentHandler) {
        log.info("🔧 Configuring WebSocket handler mapping...");

        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/ws/intent", intentHandler);

        SimpleUrlHandlerMapping handlerMapping = new SimpleUrlHandlerMapping();
        handlerMapping.setOrder(Ordered.HIGHEST_PRECEDENCE);
        handlerMapping.setUrlMap(map);

        log.info("✅ WebSocket endpoint registered: ws://localhost:8082/ws/intent");
        return handlerMapping;
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        log.info("🔧 Creating WebSocketHandlerAdapter...");
        return new WebSocketHandlerAdapter();
    }
}
