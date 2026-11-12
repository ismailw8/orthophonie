package com.orthophoniste.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class SensitiveEndpointRateLimitFilter implements GlobalFilter, Ordered {

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();
    private final Clock clock;
    private final Policy loginPolicy;
    private final Policy appointmentPolicy;

    @Autowired
    public SensitiveEndpointRateLimitFilter(
            @Value("${rate-limit.login.max-requests:10}") int loginMaxRequests,
            @Value("${rate-limit.login.window-seconds:300}") long loginWindowSeconds,
            @Value("${rate-limit.appointment.max-requests:20}") int appointmentMaxRequests,
            @Value("${rate-limit.appointment.window-seconds:3600}") long appointmentWindowSeconds) {
        this(Clock.systemUTC(),
                new Policy(loginMaxRequests, loginWindowSeconds),
                new Policy(appointmentMaxRequests, appointmentWindowSeconds));
    }

    SensitiveEndpointRateLimitFilter(Clock clock, Policy loginPolicy, Policy appointmentPolicy) {
        this.clock = clock;
        this.loginPolicy = loginPolicy;
        this.appointmentPolicy = appointmentPolicy;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Policy policy = policyFor(exchange);
        if (policy == null) {
            return chain.filter(exchange);
        }

        String key = exchange.getRequest().getPath().value() + ":" + clientAddress(exchange);
        long now = clock.instant().getEpochSecond();
        if ((requestCounter.incrementAndGet() & 1023) == 0) {
            windows.entrySet().removeIf(entry -> entry.getValue().expiresAt <= now);
        }
        Window window = windows.compute(key, (ignored, current) ->
                current == null || current.expiresAt <= now
                        ? new Window(1, now + policy.windowSeconds)
                        : new Window(current.requests + 1, current.expiresAt));

        long retryAfter = Math.max(1, window.expiresAt - now);
        exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(policy.maxRequests));
        exchange.getResponse().getHeaders().set("X-RateLimit-Remaining",
                String.valueOf(Math.max(0, policy.maxRequests - window.requests)));

        if (window.requests > policy.maxRequests) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(retryAfter));
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    private Policy policyFor(ServerWebExchange exchange) {
        if (exchange.getRequest().getMethod() != HttpMethod.POST) {
            return null;
        }
        return switch (exchange.getRequest().getPath().value()) {
            case "/api/auth/login" -> loginPolicy;
            case "/api/rdv" -> appointmentPolicy;
            default -> null;
        };
    }

    private String clientAddress(ServerWebExchange exchange) {
        InetSocketAddress address = exchange.getRequest().getRemoteAddress();
        if (address == null) {
            return "unknown";
        }
        return address.getAddress() == null
                ? address.getHostString()
                : address.getAddress().getHostAddress();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    record Policy(int maxRequests, long windowSeconds) {
        Policy {
            if (maxRequests < 1 || windowSeconds < 1) {
                throw new IllegalArgumentException("La limitation doit être strictement positive");
            }
        }
    }

    private record Window(int requests, long expiresAt) {}
}
