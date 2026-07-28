# Kova

Kova is a multilingual freelance workspace for managing projects, budgets, deadlines, and tasks. It is a portfolio-grade full-stack application built with React, Spring Boot, and PostgreSQL.

## Stack

- React 19, TypeScript, Vite
- Java 21, Spring Boot 3, Spring Security
- PostgreSQL, Spring Data JPA, Flyway
- Docker and Docker Compose
- Resend email verification
- Google Identity Services
- GitHub Actions CI
- Render deployment blueprint

## Features

- Email/password registration with a six-digit verification code
- Google sign-in with server-side credential verification
- Opaque, hashed, HttpOnly session cookies
- BCrypt password hashing
- Same-origin mutation protection and strict browser security headers
- Per-user project and task isolation
- Project creation, editing, deletion, status, budget, and deadlines
- Task creation and completion tracking
- Ukrainian, Slovak, and English interfaces
- Responsive landing, authentication, and dashboard screens
- Database migrations and automated tests

## Architecture

The production Docker image builds the React app first, embeds the generated static files in Spring Boot, and serves the UI and REST API from one origin. PostgreSQL is the only external runtime dependency.

```text
Browser
  └── Spring Boot container
        ├── React static application
        ├── REST API + Spring Security
        └── PostgreSQL (Neon in production)
```

## Local development

Copy `.env.example` to `.env`, add optional Google and Resend credentials, then run:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

For faster frontend iteration:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to Spring Boot on port `8080`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | JDBC PostgreSQL URL |
| `DATABASE_USERNAME` | PostgreSQL user |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `COOKIE_SECURE` | Enables Secure session cookies |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `RESEND_API_KEY` | Sends verification emails |
| `EMAIL_FROM` | Verified sender address |
| `VERIFICATION_PEPPER` | Secret used when hashing email codes |

Never commit real secrets. Render and Neon store them as encrypted environment variables.

## Deployment

`render.yaml` defines the free Render web service. Connect this repository in Render, provide the Neon JDBC credentials and authentication secrets, and Render will build the Docker image and deploy every commit to `main`.

The current Cloudflare deployment can remain online until the Render version is verified and the domain is switched.
