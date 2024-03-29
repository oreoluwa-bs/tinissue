import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { users } from "./users";
import { projectMembers, projects } from "./projects";

export const teams = mysqlTable(
  "teams",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 50 }).unique(),
    name: text("name"),
    profileImage: text("profile_image"),
    type: text("type", { enum: ["PERSONAL", "TEAM"] }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
    deletedAt: timestamp("deleted_at"), // Soft deletes
  },
  (self) => {
    return {
      slugIndex: uniqueIndex("slug_idx").on(self.slug),
    };
  },
);

export type Team = InferSelectModel<typeof teams>;

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  projects: many(projects),
  projectMembers: many(projectMembers),
  invites: many(teamInvites),
}));

export const teamMembers = mysqlTable(
  "team_members",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    teamId: int("team_id")
      .notNull()
      .references(() => teams.id, { onUpdate: "cascade", onDelete: "cascade" }),
    role: text("role", { enum: ["OWNER", "ADMIN", "MEMBER"] }),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.teamId),
  }),
);

export const teamInvites = mysqlTable("team_invites", {
  id: int("id").autoincrement().primaryKey(),
  email: text("email").notNull(),
  teamId: int("team_id")
    .notNull()
    .references(() => teams.id, { onUpdate: "cascade", onDelete: "cascade" }),
  accepted: boolean("accepted").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
