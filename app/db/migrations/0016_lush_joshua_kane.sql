ALTER TABLE `project_invites` RENAME COLUMN `team_id` TO `team_invite_id`;--> statement-breakpoint
ALTER TABLE `project_invites` DROP FOREIGN KEY `project_invites_team_id_team_invites_id_fk`;
--> statement-breakpoint
ALTER TABLE `project_invites` ADD CONSTRAINT `project_invites_team_invite_id_team_invites_id_fk` FOREIGN KEY (`team_invite_id`) REFERENCES `team_invites`(`id`) ON DELETE cascade ON UPDATE cascade;