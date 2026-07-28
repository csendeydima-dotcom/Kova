package com.kova.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class EmailService {
    private final RestClient resend = RestClient.builder().baseUrl("https://api.resend.com").build();
    private final String apiKey;
    private final String from;

    public EmailService(
            @Value("${kova.resend-api-key}") String apiKey,
            @Value("${kova.email-from}") String from) {
        this.apiKey = apiKey;
        this.from = from;
    }

    public void sendVerificationCode(String email, String code) {
        if (apiKey.isBlank()) throw new IllegalStateException("Email delivery is not configured");
        resend.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", from,
                        "to", new String[]{email},
                        "subject", "Kova — verification code",
                        "html", "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:36px\">" +
                                "<h1 style=\"font-size:28px\">Verify your Kova account</h1>" +
                                "<p>Your verification code:</p>" +
                                "<div style=\"font-size:36px;font-weight:800;letter-spacing:8px\">" + code + "</div>" +
                                "<p style=\"color:#666\">The code is valid for 10 minutes.</p></div>"))
                .retrieve()
                .toBodilessEntity();
    }
}
