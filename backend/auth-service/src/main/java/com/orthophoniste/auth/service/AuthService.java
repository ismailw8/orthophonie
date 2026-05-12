package com.orthophoniste.auth.service;

import com.orthophoniste.auth.dto.*;
import com.orthophoniste.auth.model.Role;
import com.orthophoniste.auth.model.User;
import com.orthophoniste.auth.repository.UserRepository;
import com.orthophoniste.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }

        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.ROLE_USER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        String email = jwtService.extractEmail(refreshToken);

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Utilisateur introuvable"));

        if (!jwtService.isTokenValid(refreshToken, email)) {
            throw new IllegalArgumentException("Refresh token invalide ou expiré");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .tokenType("Bearer")
                .role(user.getRole().name())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .build();
    }
}