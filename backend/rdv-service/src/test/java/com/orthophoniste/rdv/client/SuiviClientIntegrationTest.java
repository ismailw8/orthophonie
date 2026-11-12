package com.orthophoniste.rdv.client;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(classes = SuiviClientIntegrationTest.ClientConfiguration.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {"eureka.client.enabled=false", "spring.cloud.discovery.enabled=false"})
class SuiviClientIntegrationTest {
    private static final AtomicReference<String> requestPath = new AtomicReference<>();
    private static HttpServer server;

    @Autowired
    private SuiviClient client;

    @DynamicPropertySource
    static void configureSuiviUrl(DynamicPropertyRegistry registry) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/suivi/creneaux-occupes", exchange -> {
            requestPath.set(exchange.getRequestMethod() + " " + exchange.getRequestURI());
            byte[] response = "[\"09:00\",\"10:15\"]".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var body = exchange.getResponseBody()) { body.write(response); }
        });
        server.start();
        registry.add("clients.suivi.url", () -> "http://127.0.0.1:" + server.getAddress().getPort());
    }

    @AfterAll
    static void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void retrievesOccupiedSlotsFromConfiguredSuiviService() {
        assertEquals(List.of("09:00", "10:15"), client.occupiedSlots("2026-10-08"));
        assertEquals("GET /api/suivi/creneaux-occupes?date=2026-10-08", requestPath.get());
    }

    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {MongoAutoConfiguration.class,
            MongoDataAutoConfiguration.class, MongoRepositoriesAutoConfiguration.class})
    @EnableFeignClients(clients = SuiviClient.class)
    static class ClientConfiguration { }
}
