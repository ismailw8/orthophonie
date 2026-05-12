package com.orthophoniste.gateway.filter;

import com.orthophoniste.gateway.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class JwtAuthFilter extends
        AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        super(Config.class);
        this.jwtService = jwtService;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            // Route publique : on laisse passer sans vérification
            if (!config.isSecured()) {
                return chain.filter(exchange);
            }

            String authHeader = exchange.getRequest()
                    .getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Requête sans token vers : {}",
                        exchange.getRequest().getPath());
                return onError(exchange, HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            if (!jwtService.isTokenValid(token)) {
                log.warn("Token invalide ou expiré");
                return onError(exchange, HttpStatus.UNAUTHORIZED);
            }

            // Propager email et rôle aux microservices via headers
            String email = jwtService.extractEmail(token);
            String role  = jwtService.extractRole(token);

            var mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Email", email)
                    .header("X-User-Role", role)
                    .build();

            return chain.filter(exchange.mutate()
                    .request(mutatedRequest)
                    .build());
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
        private boolean secured = true;

        public boolean isSecured() { return secured; }
        public void setSecured(boolean secured) { this.secured = secured; }
    }
}