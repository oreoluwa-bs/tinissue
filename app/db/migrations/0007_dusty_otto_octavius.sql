CREATE TABLE `milestone_assignees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`milestone_id` int NOT NULL,
	CONSTRAINT `milestone_assignees_id` PRIMARY KEY(`id`),
	CONSTRAINT `sk_idx` UNIQUE(`user_id`,`milestone_id`)
);
--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100),
	`name` text NOT NULL,
	`description` text,
	`team_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_milestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `milestone_assignees` ADD CONSTRAINT `milestone_assignees_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `milestone_assignees` ADD CONSTRAINT `milestone_assignees_milestone_id_project_milestones_id_fk` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_team_id_projects_id_fk` FOREIGN KEY (`team_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;