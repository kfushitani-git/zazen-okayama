CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`body` text NOT NULL,
	`record_date` text NOT NULL,
	`status` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`author` text DEFAULT '伏谷' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `records_status_date_idx` ON `records` (`status`,`record_date`);