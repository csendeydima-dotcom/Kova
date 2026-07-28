package com.kova.controller;

import com.kova.model.EmailVerification;
import com.kova.model.User;
import com.kova.repository.EmailVerificationRepository;
import com.kova.repository.UserRepository;
import com.kova.security.CurrentUser;
import com.kova.service.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 60, message = "Name must contain 2–60 characters") String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank
            @Size(min = 10, max = 128, message = "Password must contain 10–128 characters")
            @Pattern(regexp = "^(?=.*\\p{L})(?=.*\\d).+$", message = "Password must contain a letter and a number")
            String password) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank @Size(max = 128) String password) {}
    public record VerifyRequest(@NotBlank @Email String email, @NotBlank @Size(min = 6, max = 6) String code) {}
    public record GoogleRequest(@NotBlank String credential) {}
    public record UserResponse(Long id, String email, String name) {
        static UserResponse from(User user) { return new UserResponse(user.getId(), user.getEmail(), user.getName()); }
        static UserResponse from(CurrentUser user) { return new UserResponse(user.id(), user.email(), user.name()); }
    }

    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository users;
    private final EmailVerificationRepository verifications;
    private final PasswordService passwords;
    private final SessionService sessions;
    private final EmailService emailService;
    private final GoogleIdentityService google;
    private final AuthRateLimiter rateLimiter;
    private final String pepper;
    private final String googleClientId;

    public AuthController(
            UserRepository users,
            EmailVerificationRepository verifications,
            PasswordService passwords,
            SessionService sessions,
            EmailService emailService,
            GoogleIdentityService google,
            AuthRateLimiter rateLimiter,
            @Value("${kova.verification-pepper}") String pepper,
            @Value("${kova.google-client-id}") String googleClientId) {
        this.users = users;
        this.verifications = verifications;
        this.passwords = passwords;
        this.sessions = sessions;
        this.emailService = emailService;
        this.google = google;
        this.rateLimiter = rateLimiter;
        this.pepper = pepper;
        this.googleClientId = googleClientId;
    }

    @GetMapping("/config")
    Map<String, Object> config() {
        return Map.of("googleClientId", googleClientId);
    }

    @GetMapping("/me")
    ResponseEntity<?> me(@AuthenticationPrincipal CurrentUser user) {
        return user == null
                ? ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not signed in"))
                : ResponseEntity.ok(Map.of("user", UserResponse.from(user)));
    }

    @PostMapping("/register")
    @Transactional
    ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.email());
        guardRateLimit("register:" + clientKey(httpRequest, email));
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        String code = "%06d".formatted(RANDOM.nextInt(1_000_000));
        EmailVerification verification = new EmailVerification(
                email,
                request.name().trim(),
                passwords.encode(request.password()),
                codeHash(email, code),
                Instant.now().plus(Duration.ofMinutes(10)));
        verifications.save(verification);
        emailService.sendVerificationCode(email, code);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("verificationRequired", true, "email", email));
    }

    @PostMapping("/verify-email")
    @Transactional
    ResponseEntity<?> verify(@Valid @RequestBody VerifyRequest request) {
        String email = normalizeEmail(request.email());
        EmailVerification verification = verifications.findById(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code expired"));
        if (verification.getExpiresAt().isBefore(Instant.now()) || verification.getAttempts() >= 5) {
            verifications.delete(verification);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code expired");
        }
        if (!Hashing.constantTimeEquals(verification.getCodeHash(), codeHash(email, request.code()))) {
            verification.incrementAttempts();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect verification code");
        }
        User user = users.save(new User(email, verification.getName(), verification.getPasswordHash()));
        verifications.delete(verification);
        return signedIn(user);
    }

    @PostMapping("/login")
    ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.email());
        String rateKey = "login:" + clientKey(httpRequest, email);
        guardRateLimit(rateKey);
        User user = users.findByEmailIgnoreCase(email)
                .filter(candidate -> candidate.getPasswordHash() != null
                        && passwords.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        if (passwords.needsUpgrade(user.getPasswordHash())) {
            user.setPasswordHash(passwords.encode(request.password()));
            users.save(user);
        }
        rateLimiter.reset(rateKey);
        return signedIn(user);
    }

    @PostMapping("/google")
    @Transactional
    ResponseEntity<?> google(@Valid @RequestBody GoogleRequest request) {
        var identity = google.verify(request.credential());
        String email = normalizeEmail(identity.email());
        User user = users.findByEmailIgnoreCase(email).orElseGet(() ->
                users.save(new User(email, safeName(identity.name(), email), null)));
        return signedIn(user);
    }

    @PostMapping("/logout")
    ResponseEntity<?> logout(HttpServletRequest request) {
        String token = request.getCookies() == null ? null : Arrays.stream(request.getCookies())
                .filter(cookie -> SessionService.COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue).findFirst().orElse(null);
        sessions.revoke(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, sessions.clearCookie().toString()).build();
    }

    private ResponseEntity<?> signedIn(User user) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessions.create(user).toString())
                .body(Map.of("user", UserResponse.from(user)));
    }

    private void guardRateLimit(String key) {
        if (!rateLimiter.allow(key)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
        }
    }

    private String codeHash(String email, String code) {
        return Hashing.sha256(email + ":" + code + ":" + pepper);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String clientKey(HttpServletRequest request, String email) {
        String forwarded = request.getHeader("CF-Connecting-IP");
        return (forwarded == null ? request.getRemoteAddr() : forwarded) + ":" + email;
    }

    private static String safeName(String name, String email) {
        String candidate = name == null ? "" : name.trim();
        if (candidate.length() >= 2 && candidate.length() <= 60) return candidate;
        return email.substring(0, Math.min(email.indexOf('@'), 60));
    }
}
