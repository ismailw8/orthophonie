package com.orthophoniste.auth.controller;

import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<Map<String, String>> badCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Identifiants invalides"));
    }

    @ExceptionHandler({JwtException.class})
    ResponseEntity<Map<String, String>> invalidToken() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Jeton invalide ou expiré"));
    }

    @ExceptionHandler({IllegalArgumentException.class, DuplicateKeyException.class})
    ResponseEntity<Map<String, String>> badRequest(RuntimeException exception) {
        String message = exception instanceof DuplicateKeyException
                ? "Email déjà utilisé"
                : exception.getMessage();
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Requête invalide");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
