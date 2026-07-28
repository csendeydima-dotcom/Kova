package com.kova.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GoogleIdentityService {
    public record GoogleUser(
            String sub,
            String email,
            String name,
            String aud,
            @JsonProperty("email_verified") String emailVerified) {}

    private final RestClient google = RestClient.create();
    private final String clientId;

    public GoogleIdentityService(@Value("${kova.google-client-id}") String clientId) {
        this.clientId = clientId;
    }

    public GoogleUser verify(String credential) {
        if (clientId.isBlank()) throw new IllegalStateException("Google sign-in is not configured");
        GoogleUser user = google.get()
                .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", credential)
                .retrieve()
                .body(GoogleUser.class);
        if (user == null || !Objects.equals(clientId, user.aud())
                || !"true".equalsIgnoreCase(user.emailVerified())
                || user.email() == null || user.email().isBlank()) {
            throw new IllegalArgumentException("Invalid Google credential");
        }
        return user;
    }
}
