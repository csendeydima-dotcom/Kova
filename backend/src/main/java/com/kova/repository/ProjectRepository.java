package com.kova.repository;

import com.kova.model.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Project> findByIdAndUserId(Long id, Long userId);
}
