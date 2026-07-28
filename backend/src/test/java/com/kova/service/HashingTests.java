package com.kova.service;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class HashingTests {
    @Test
    void tokenIsRandomAndHashIsStable() {
        String first = Hashing.randomToken(48);
        String second = Hashing.randomToken(48);
        assertNotEquals(first, second);
        assertEquals(64, Hashing.sha256(first).length());
        assertTrue(Hashing.constantTimeEquals(Hashing.sha256(first), Hashing.sha256(first)));
    }
}
