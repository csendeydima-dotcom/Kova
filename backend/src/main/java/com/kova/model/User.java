package com.kova.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 254)
    private String email;
    @Column(nullable = false, length = 60)
    private String name;
    @Column(name = "password_hash", length = 100)
    private String passwordHash;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected User() {}
    public User(String email, String name, String passwordHash) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
    }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getPasswordHash() { return passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
    public void setName(String name) { this.name = name; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
