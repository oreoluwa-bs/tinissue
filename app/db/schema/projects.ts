import { relations } from "drizzle-orm";
import {
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { teams } from "./teams";
import { users } from "./users";

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 100 }), // .unique(),
    name: text("name"),
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

export const projectRelations = relations(projects, ({ one, many }) => {
  return {
    team: one(teams, {
      fields: [projects.teamId],
      references: [teams.id],
    }),
    projectMembers: many(projectMembers),
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
  },
  (t) => ({
    pk: primaryKey(t.userId, t.teamId, t.projectId),
  }),
);
//   role: text("role", { enum: ["ADMIN", "MEMBER"] }),
