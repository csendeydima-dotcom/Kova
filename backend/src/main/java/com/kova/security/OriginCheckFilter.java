package com.kova.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class OriginCheckFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean mutation = !request.getMethod().matches("GET|HEAD|OPTIONS");
        String origin = request.getHeader("Origin");
        if (mutation && request.getRequestURI().startsWith("/api/")
                && origin != null && !sameOrigin(request, origin)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Untrusted origin");
            return;
        }
        chain.doFilter(request, response);
    }

    private static boolean sameOrigin(HttpServletRequest request, String origin) {
        try {
            URI uri = URI.create(origin);
            int originPort = uri.getPort() >= 0 ? uri.getPort() : defaultPort(uri.getScheme());
            return uri.getScheme().equalsIgnoreCase(request.getScheme())
                    && uri.getHost() != null
                    && uri.getHost().equalsIgnoreCase(request.getServerName())
                    && originPort == request.getServerPort();
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static int defaultPort(String scheme) {
        return "https".equalsIgnoreCase(scheme) ? 443 : 80;
    }
}
