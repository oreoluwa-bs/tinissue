import {
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { type InferModel } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: varchar("email", { length: 50 }).unique().notNull(),
    password: text("password"),

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
