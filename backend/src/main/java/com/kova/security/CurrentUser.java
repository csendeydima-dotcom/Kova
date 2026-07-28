package com.kova.security;

import com.kova.model.User;

public record CurrentUser(Long id, String email, String name) {
    public static CurrentUser from(User user) {
        return new CurrentUser(user.getId(), user.getEmail(), user.getName());
    }
}
