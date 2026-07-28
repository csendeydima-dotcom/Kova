package com.kova.service;

import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    private final PasswordEncoder encoder;

    public PasswordService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public String encode(String password) {
        return encoder.encode(password);
    }

    public boolean matches(String password, String storedHash) {
        if (storedHash == null) return false;
        if (!storedHash.startsWith("pbkdf2_sha256$")) return encoder.matches(password, storedHash);
        try {
            String[] parts = storedHash.split("\\$");
            if (parts.length != 4) return false;
            int iterations = Integer.parseInt(parts[1]);
            if (iterations < 100_000 || iterations > 600_000) return false;
            byte[] salt = Base64.getUrlDecoder().decode(parts[2]);
            byte[] expected = Base64.getUrlDecoder().decode(parts[3]);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, expected.length * 8);
            byte[] actual = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception ignored) {
            return false;
        }
    }

    public boolean needsUpgrade(String storedHash) {
        return storedHash != null && storedHash.startsWith("pbkdf2_sha256$");
    }
}
