CREATE TABLE `temple_updates` (
	`temple_id` text PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`checklist` text DEFAULT '[]' NOT NULL,
	`private_notes` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
