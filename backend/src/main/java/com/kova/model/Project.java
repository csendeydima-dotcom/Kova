package com.kova.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 80)
    private String name;
    @Column(nullable = false, length = 80)
    private String client;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budget;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ProjectStatus status;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected Project() {}
    public Project(User user, String name, String client, BigDecimal budget, ProjectStatus status, LocalDate dueDate) {
        this.user = user;
        update(name, client, budget, status, dueDate);
    }
    public void update(String name, String client, BigDecimal budget, ProjectStatus status, LocalDate dueDate) {
        this.name = name; this.client = client; this.budget = budget; this.status = status; this.dueDate = dueDate;
    }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public String getClient() { return client; }
    public BigDecimal getBudget() { return budget; }
    public ProjectStatus getStatus() { return status; }
    public LocalDate getDueDate() { return dueDate; }
    public Instant getCreatedAt() { return createdAt; }
}
