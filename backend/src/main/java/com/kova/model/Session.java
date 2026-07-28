package com.kova.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sessions")
public class Session {
    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected Session() {}
    public Session(String tokenHash, User user, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.user = user;
        this.expiresAt = expiresAt;
    }
    public String getTokenHash() { return tokenHash; }
    public User getUser() { return user; }
    public Instant getExpiresAt() { return expiresAt; }
}
