CREATE TABLE `project_members` (
	`user_id` int NOT NULL,
	`team_id` int NOT NULL,
	`project_id` int NOT NULL,
	CONSTRAINT `project_members_project_id_team_id_user_id` PRIMARY KEY(`project_id`,`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100),
	`name` text,
	`description` text,
	`team_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE cascade;