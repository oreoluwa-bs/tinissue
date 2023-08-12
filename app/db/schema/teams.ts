import { relations } from "drizzle-orm";
import {
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  int,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

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

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
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
    role: text("role", { enum: ["OWNER", "MEMBER"] }),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.teamId),
  }),
);
