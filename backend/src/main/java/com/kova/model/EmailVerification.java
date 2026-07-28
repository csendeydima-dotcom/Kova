package com.kova.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "email_verifications")
public class EmailVerification {
    @Id @Column(length = 254)
    private String email;
    @Column(nullable = false, length = 60)
    private String name;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Column(name = "code_hash", nullable = false, length = 64)
    private String codeHash;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(nullable = false)
    private int attempts;
    @Column(name = "last_sent_at", nullable = false)
    private Instant lastSentAt;

    protected EmailVerification() {}
    public EmailVerification(String email, String name, String passwordHash, String codeHash, Instant expiresAt) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.lastSentAt = Instant.now();
    }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getPasswordHash() { return passwordHash; }
    public String getCodeHash() { return codeHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public int getAttempts() { return attempts; }
    public Instant getLastSentAt() { return lastSentAt; }
    public void incrementAttempts() { attempts++; }
}
