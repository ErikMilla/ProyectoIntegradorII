package com.dropStore.DropStore.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.time.Clock;
import java.util.function.Supplier;

/**
 * Configuracion unica de seguridad y CORS.
 *
 * Antes existian tres definiciones de CORS a la vez (un CorsFilter, esta clase
 * y un @CrossOrigin en cada controlador). Ahora el origen permitido se define
 * en un solo lugar: la propiedad dropstore.cors.allowed-origin.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${dropstore.cors.allowed-origin}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .securityContext(context -> context.requireExplicitSave(true))
            .exceptionHandling(errors -> errors.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .headers(headers -> headers
                    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
                    .frameOptions(frame -> frame.deny()))
            .authorizeHttpRequests(auth -> auth
                // El navegador envia OPTIONS antes de cada POST/PUT/DELETE.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Login y registro son publicos por definicion.
                .requestMatchers("/api/auth/login", "/api/auth/registro/**", "/api/auth/csrf", "/api/auth/mfa/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/contenido-tienda").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/contenido-tienda").hasRole("ADMIN")
                // Las fotos de producto se muestran en la tienda publica.
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stock/eventos", "/actuator/health/**").permitAll()
                // Catalogo publico: el cliente navega sin iniciar sesion.
                .requestMatchers(HttpMethod.GET, "/api/productos/**", "/api/marcas/**", "/api/categorias/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/productos/**", "/api/marcas/**", "/api/categorias/**")
                    .hasAnyRole("ADMIN", "ALMACENERO")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**", "/api/marcas/**", "/api/categorias/**")
                    .hasAnyRole("ADMIN", "ALMACENERO")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**", "/api/marcas/**", "/api/categorias/**")
                    .hasAnyRole("ADMIN", "ALMACENERO")
                .requestMatchers(HttpMethod.GET, "/api/usuarios/clientes").hasAnyRole("ADMIN", "VENDEDOR")
                .requestMatchers(HttpMethod.POST, "/api/usuarios").hasAnyRole("ADMIN", "VENDEDOR")
                .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/ventas").hasAnyRole("CLIENTE", "ADMIN", "VENDEDOR")
                .requestMatchers(HttpMethod.GET, "/api/v1/ventas/usuario/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/ventas/todas").hasAnyRole("ADMIN", "ALMACENERO", "VENDEDOR")
                .requestMatchers(HttpMethod.GET, "/api/v1/ventas/pagina").hasAnyRole("ADMIN", "ALMACENERO", "VENDEDOR")
                .requestMatchers(HttpMethod.GET, "/api/v1/ventas/reportes/**").hasAnyRole("ADMIN", "ALMACENERO", "VENDEDOR")
                .requestMatchers(HttpMethod.GET, "/api/v1/ventas/**").hasAnyRole("ADMIN", "ALMACENERO", "VENDEDOR", "CLIENTE")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/ventas/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        return http.build();
    }

    /**
     * Cifrado de contrasenas. BCrypt incluye su propia sal, por eso no hay que
     * guardar nada aparte.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Los clientes JavaScript leen de la cookie el token CSRF sin enmascarar y
     * lo envían en X-XSRF-TOKEN. Para formularios tradicionales se conserva el
     * token enmascarado que evita ataques BREACH.
     */
    private static final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {
        private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
        private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                           Supplier<CsrfToken> csrfToken) {
            xor.handle(request, response, csrfToken);
            csrfToken.get();
        }

        @Override
        public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
            String headerValue = request.getHeader(csrfToken.getHeaderName());
            return headerValue != null && !headerValue.isBlank()
                    ? plain.resolveCsrfTokenValue(request, csrfToken)
                    : xor.resolveCsrfTokenValue(request, csrfToken);
        }
    }
}
