package com.kova.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AuthRateLimiter {
    private record Window(int attempts, Instant startsAt, Instant blockedUntil) {}
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean allow(String key) {
        Instant now = Instant.now();
        Window current = windows.compute(key, (ignored, previous) -> {
            if (previous == null || previous.startsAt().plus(Duration.ofMinutes(15)).isBefore(now)) {
                return new Window(1, now, Instant.EPOCH);
            }
            if (previous.blockedUntil().isAfter(now)) return previous;
            int attempts = previous.attempts() + 1;
            Instant blocked = attempts > 10 ? now.plus(Duration.ofMinutes(15)) : Instant.EPOCH;
            return new Window(attempts, previous.startsAt(), blocked);
        });
        return !current.blockedUntil().isAfter(now);
    }

    public void reset(String key) {
        windows.remove(key);
    }
}
