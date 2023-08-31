CREATE TABLE `team_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` text NOT NULL,
	`team_id` int NOT NULL,
	`accepted` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `team_invites` ADD CONSTRAINT `team_invites_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE cascade;