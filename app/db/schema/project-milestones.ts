import {
  datetime,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { projects } from "./projects";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { statusValues } from "~/features/projects/milestones/shared";

export const projectMilestones = mysqlTable(
  "project_milestones",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 100 }), // .unique(),
    name: text("name").notNull(),
    description: text("description"),
    projectId: int("project_id")
      .notNull()
      .references(() => projects.id),

    // projectBoardId: int("project_board_id")
    //   .notNull()
    //   .references(() => projectBoards.id),

    status: text("status", {
      enum: statusValues,
    })
      .notNull()
      .default("BACKLOG"),

    dueAt: datetime("due_at", { mode: "date" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
  },
  (self) => {
    return {
      slugIndex: uniqueIndex("slug_idx").on(self.slug),
    };
  },
);

export const projectMilestoneRelations = relations(
  projectMilestones,
  ({ one, many }) => {
    return {
      project: one(projects, {
        fields: [projectMilestones.projectId],
        references: [projects.id],
      }),
      assignees: many(projectMilestoneAssignees),
      // boards: one(projectBoards, {
      //   fields: [projectMilestones.projectBoardId],
      //   references: [projectBoards.id],
      // }),
    };
  },
);

export const projectMilestoneAssignees = mysqlTable(
  "milestone_assignees",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    projectMilestoneId: int("milestone_id")
      .notNull()
      .references(() => projectMilestones.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.projectMilestoneId),
    // sk: uniqueIndex("sk_idx").on(t.userId, t.projectMilestoneId),
  }),
);

// export const projectBoards = mysqlTable(
//   "milestone_boards",
//   {
//     id: int("id").autoincrement().primaryKey(),
//     name: text("name").notNull(),
//     projectId: int("project_id")
//       .notNull()
//       .references(() => projects.id),

//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").onUpdateNow(),
//   },
//   (self) => {
//     return {};
//   },
// );
