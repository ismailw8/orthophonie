package com.orthophoniste.suivi.config;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import java.util.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
 @Bean SecurityFilterChain chain(HttpSecurity http)throws Exception{http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/actuator/**","/error","/api/suivi/creneaux-occupes").permitAll().requestMatchers("/api/suivi/mon-dashboard").hasRole("USER").requestMatchers("/api/suivi/admin/**").hasAnyRole("ADMIN","SUPER_ADMIN").anyRequest().authenticated()).oauth2ResourceServer(o->o.jwt(j->j.jwtAuthenticationConverter(converter())));return http.build();}
 @Bean JwtAuthenticationConverter converter(){JwtAuthenticationConverter c=new JwtAuthenticationConverter();c.setPrincipalClaimName("email");c.setJwtGrantedAuthoritiesConverter(jwt->{Map<String,Object>a=jwt.getClaim("realm_access");if(a==null)return List.of();Collection<String>r=(Collection<String>)a.getOrDefault("roles",List.of());return r.stream().<org.springframework.security.core.GrantedAuthority>map(SimpleGrantedAuthority::new).toList();});return c;}
}
