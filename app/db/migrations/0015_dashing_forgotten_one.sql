CREATE TABLE `project_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` text NOT NULL,
	`project_id` int NOT NULL,
	`team_id` int,
	`accepted` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_invites` ADD CONSTRAINT `project_invites_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project_invites` ADD CONSTRAINT `project_invites_team_id_team_invites_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team_invites`(`id`) ON DELETE cascade ON UPDATE cascade;