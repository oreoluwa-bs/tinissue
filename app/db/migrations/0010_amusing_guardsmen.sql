ALTER TABLE `milestone_assignees` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `milestone_assignees` DROP CONSTRAINT `sk_idx`;--> statement-breakpoint
ALTER TABLE `milestone_assignees` DROP COLUMN `id`;--> statement-breakpoint
ALTER TABLE `milestone_assignees` ADD PRIMARY KEY(`milestone_id`,`user_id`);