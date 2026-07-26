CREATE TABLE `email_verifications` (
  `email` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `password_hash` text NOT NULL,
  `code_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `last_sent_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_verifications_expiry_idx` ON `email_verifications` (`expires_at`);
