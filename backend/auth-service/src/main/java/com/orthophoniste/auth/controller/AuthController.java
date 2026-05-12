package com.orthophoniste.auth.controller;

import com.orthophoniste.auth.dto.*;
import com.orthophoniste.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestHeader("Refresh-Token") String token) {
        return ResponseEntity.ok(authService.refresh(token));
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validate(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok("Token valide");
    }
}