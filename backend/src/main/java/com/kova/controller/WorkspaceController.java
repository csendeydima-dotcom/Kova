package com.kova.controller;

import com.kova.model.Project;
import com.kova.model.ProjectStatus;
import com.kova.model.Task;
import com.kova.repository.ProjectRepository;
import com.kova.repository.TaskRepository;
import com.kova.repository.UserRepository;
import com.kova.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
    public record ProjectRequest(
            @NotBlank @Size(min = 2, max = 80) String name,
            @NotBlank @Size(min = 2, max = 80) String client,
            @NotNull @DecimalMin("0") @DecimalMax("10000000") BigDecimal budget,
            @NotNull ProjectStatus status,
            @NotNull LocalDate dueDate) {}
    public record ProjectResponse(
            Long id, String name, String client, BigDecimal budget, ProjectStatus status,
            LocalDate dueDate, Instant createdAt) {
        static ProjectResponse from(Project value) {
            return new ProjectResponse(value.getId(), value.getName(), value.getClient(), value.getBudget(),
                    value.getStatus(), value.getDueDate(), value.getCreatedAt());
        }
    }
    public record TaskRequest(@NotBlank @Size(min = 2, max = 120) String title, @NotNull Long projectId) {}
    public record TaskPatch(@NotNull Boolean completed) {}
    public record TaskResponse(Long id, Long projectId, String title, boolean completed, Instant createdAt) {
        static TaskResponse from(Task value) {
            return new TaskResponse(value.getId(), value.getProject().getId(), value.getTitle(),
                    value.isCompleted(), value.getCreatedAt());
        }
    }

    private final UserRepository users;
    private final ProjectRepository projects;
    private final TaskRepository tasks;

    public WorkspaceController(UserRepository users, ProjectRepository projects, TaskRepository tasks) {
        this.users = users;
        this.projects = projects;
        this.tasks = tasks;
    }

    @GetMapping("/workspace")
    @Transactional(readOnly = true)
    Map<String, Object> workspace(@AuthenticationPrincipal CurrentUser current) {
        return Map.of(
                "user", new AuthController.UserResponse(current.id(), current.email(), current.name()),
                "projects", projects.findAllByUserIdOrderByCreatedAtDesc(current.id()).stream()
                        .map(ProjectResponse::from).toList(),
                "tasks", tasks.findAllByUserIdOrderByCreatedAtDesc(current.id()).stream()
                        .map(TaskResponse::from).toList());
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Map<String, Object> createProject(
            @AuthenticationPrincipal CurrentUser current,
            @Valid @RequestBody ProjectRequest request) {
        var user = users.getReferenceById(current.id());
        Project project = projects.save(new Project(user, request.name().trim(), request.client().trim(),
                request.budget(), request.status(), request.dueDate()));
        return Map.of("project", ProjectResponse.from(project));
    }

    @PatchMapping("/projects/{id}")
    @Transactional
    Map<String, Object> updateProject(
            @AuthenticationPrincipal CurrentUser current,
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request) {
        Project project = ownProject(current.id(), id);
        project.update(request.name().trim(), request.client().trim(), request.budget(),
                request.status(), request.dueDate());
        return Map.of("project", ProjectResponse.from(project));
    }

    @DeleteMapping("/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void deleteProject(@AuthenticationPrincipal CurrentUser current, @PathVariable Long id) {
        Project project = ownProject(current.id(), id);
        projects.delete(project);
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Map<String, Object> createTask(
            @AuthenticationPrincipal CurrentUser current,
            @Valid @RequestBody TaskRequest request) {
        Project project = ownProject(current.id(), request.projectId());
        var user = users.getReferenceById(current.id());
        Task task = tasks.save(new Task(project, user, request.title().trim()));
        return Map.of("task", TaskResponse.from(task));
    }

    @PatchMapping("/tasks/{id}")
    @Transactional
    Map<String, Object> updateTask(
            @AuthenticationPrincipal CurrentUser current,
            @PathVariable Long id,
            @Valid @RequestBody TaskPatch request) {
        Task task = tasks.findByIdAndUserId(id, current.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        task.setCompleted(request.completed());
        return Map.of("task", TaskResponse.from(task));
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void deleteTask(@AuthenticationPrincipal CurrentUser current, @PathVariable Long id) {
        Task task = tasks.findByIdAndUserId(id, current.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        tasks.delete(task);
    }

    private Project ownProject(Long userId, Long projectId) {
        return projects.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }
}
