package com.kova.repository;

import com.kova.model.Session;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SessionRepository extends JpaRepository<Session, String> {
    @Query("select s from Session s join fetch s.user where s.tokenHash = :tokenHash and s.expiresAt > :now")
    Optional<Session> findActive(String tokenHash, Instant now);
    @Modifying
    void deleteByExpiresAtBefore(Instant now);
}
