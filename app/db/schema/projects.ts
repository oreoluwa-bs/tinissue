import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { teamInvites, teams } from "./teams";
import { users } from "./users";
import { projectMilestones } from "./project-milestones";

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 100 }), // .unique(),
    name: text("name").notNull(),
    description: text("description"),
    teamId: int("team_id").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
    //   deletedAt: timestamp("deleted_at"), // Soft deletes
  },
  (self) => {
    return {
      slugIndex: uniqueIndex("slug_idx").on(self.slug),
    };
  },
);

export type Project = InferSelectModel<typeof projects>;

export const projectRelations = relations(projects, ({ one, many }) => {
  return {
    team: one(teams, {
      fields: [projects.teamId],
      references: [teams.id],
    }),
    projectMembers: many(projectMembers),
    milestones: many(projectMilestones),
    invites: many(projectInvites),
    // boards: many(projectBoards),
  };
});

export const projectMembers = mysqlTable(
  "project_members",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    teamId: int("team_id")
      .notNull()
      .references(() => teams.id, { onUpdate: "cascade", onDelete: "cascade" }),
    projectId: int("project_id")
      .notNull()
      .references(() => projects.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    role: text("role", { enum: ["OWNER", "ADMIN", "MEMBER"] }).default(
      "MEMBER",
    ),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.teamId, t.projectId),
  }),
);
//   role: text("role", { enum: ["ADMIN", "MEMBER"] }),

export const projectInvites = mysqlTable("project_invites", {
  id: int("id").autoincrement().primaryKey(),
  email: text("email").notNull(),
  projectId: int("project_id")
    .notNull()
    .references(() => projects.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  // teamId: int("team_id")
  //   .notNull()
  //   .references(() => teams.id, { onUpdate: "cascade", onDelete: "cascade" }),
  // Add this if the user does not exist
  teamInviteId: int("team_invite_id").references(() => teamInvites.id, {
    onUpdate: "cascade",
    onDelete: "cascade",
  }),
  accepted: boolean("accepted").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
