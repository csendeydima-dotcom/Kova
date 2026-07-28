CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  password_hash VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE email_verifications (
  email VARCHAR(254) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE auth_attempts (
  attempt_key VARCHAR(320) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ
);

CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  client VARCHAR(80) NOT NULL,
  budget NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'review', 'done')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX projects_user_id_idx ON projects(user_id);

CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_project_id_idx ON tasks(project_id);
