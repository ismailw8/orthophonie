package com.orthophoniste.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class SensitiveEndpointRateLimitFilterTest {

    @Test
    void blocksLoginAfterConfiguredLimit() {
        var filter = new SensitiveEndpointRateLimitFilter(
                Clock.fixed(Instant.parse("2026-08-10T10:00:00Z"), ZoneOffset.UTC),
                new SensitiveEndpointRateLimitFilter.Policy(2, 60),
                new SensitiveEndpointRateLimitFilter.Policy(10, 60));
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        filter.filter(exchange("/api/auth/login"), chain).block();
        filter.filter(exchange("/api/auth/login"), chain).block();
        var blocked = exchange("/api/auth/login");
        filter.filter(blocked, chain).block();

        assertThat(forwarded).hasValue(2);
        assertThat(blocked.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(blocked.getResponse().getHeaders().getFirst("Retry-After")).isEqualTo("60");
    }

    @Test
    void ignoresUnrelatedEndpoints() {
        var filter = new SensitiveEndpointRateLimitFilter(
                Clock.systemUTC(),
                new SensitiveEndpointRateLimitFilter.Policy(1, 60),
                new SensitiveEndpointRateLimitFilter.Policy(1, 60));
        AtomicInteger forwarded = new AtomicInteger();

        filter.filter(exchange("/api/suivi/mon-dashboard"), request -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        }).block();

        assertThat(forwarded).hasValue(1);
    }

    private MockServerWebExchange exchange(String path) {
        return MockServerWebExchange.from(MockServerHttpRequest.post(path).build());
    }
}
