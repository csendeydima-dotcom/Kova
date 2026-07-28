package com.kova.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "tasks")
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false)
    private boolean completed;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected Task() {}
    public Task(Project project, User user, String title) {
        this.project = project; this.user = user; this.title = title;
    }
    public Long getId() { return id; }
    public Project getProject() { return project; }
    public User getUser() { return user; }
    public String getTitle() { return title; }
    public boolean isCompleted() { return completed; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}
