ALTER TABLE `users` ADD `password_hash` text;
--> statement-breakpoint
CREATE TABLE `sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `user_email` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `sessions_owner_idx` ON `sessions` (`user_email`);
--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `auth_attempts` (
  `key` text PRIMARY KEY NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `window_started_at` integer NOT NULL,
  `locked_until` integer DEFAULT 0 NOT NULL
);
