import {
  mysqlTable,
  int,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations, type InferModel } from "drizzle-orm";
import { teamMembers } from "./teams";
import { projectMembers } from "./projects";
import { projectMilestoneAssignees } from "./project-milestones";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: varchar("email", { length: 50 }).unique().notNull(),
    password: text("password"),
    profilePhoto: text("profile_photo"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
    deletedAt: timestamp("deleted_at"), // Soft deletes
  },
  (self) => {
    return {
      emailIndex: uniqueIndex("email_idx").on(self.email),
    };
  },
);

export type User = InferModel<typeof users>;
export type InsertUser = InferModel<typeof users, "insert">;

export const usersRelations = relations(users, ({ many }) => ({
  teams: many(teamMembers),
  projects: many(projectMembers),
  assigned: many(projectMilestoneAssignees),
}));
