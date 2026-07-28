package com.kova.service;

import com.kova.model.Session;
import com.kova.model.User;
import com.kova.repository.SessionRepository;
import com.kova.security.CurrentUser;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {
    public static final String COOKIE_NAME = "kova_session";
    private final SessionRepository sessions;
    private final int sessionDays;
    private final boolean secure;

    public SessionService(
            SessionRepository sessions,
            @Value("${kova.session-days}") int sessionDays,
            @Value("${kova.cookie-secure}") boolean secure) {
        this.sessions = sessions;
        this.sessionDays = sessionDays;
        this.secure = secure;
    }

    @Transactional(readOnly = true)
    public Optional<CurrentUser> authenticate(String rawToken) {
        if (rawToken.length() < 32 || rawToken.length() > 160) return Optional.empty();
        return sessions.findActive(Hashing.sha256(rawToken), Instant.now())
                .map(Session::getUser)
                .map(CurrentUser::from);
    }

    @Transactional
    public ResponseCookie create(User user) {
        String rawToken = Hashing.randomToken(48);
        Duration lifetime = Duration.ofDays(sessionDays);
        sessions.save(new Session(Hashing.sha256(rawToken), user, Instant.now().plus(lifetime)));
        return ResponseCookie.from(COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(lifetime)
                .build();
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) sessions.deleteById(Hashing.sha256(rawToken));
    }

    public ResponseCookie clearCookie() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true).secure(secure).sameSite("Lax").path("/").maxAge(Duration.ZERO).build();
    }
}
