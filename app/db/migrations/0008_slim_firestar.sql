ALTER TABLE `project_milestones` DROP FOREIGN KEY `project_milestones_team_id_projects_id_fk`;
--> statement-breakpoint
ALTER TABLE `project_milestones` RENAME COLUMN `team_id` TO `project_id`;--> statement-breakpoint
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;