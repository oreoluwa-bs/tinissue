import { sql } from "drizzle-orm";
import type { users } from "~/db/schema";

export function userSelect(table: typeof users) {
  return {
    id: table.id,
    firstName: table.firstName,
    lastName: table.lastName,
    fullName: sql<string>`CONCAT(${table.firstName},' ', ${table.lastName})`,
    initials: sql<string>`CONCAT(LEFT(${table.firstName}, 1),LEFT(${table.lastName}, 1))`,
    email: table.email,
    profilePhoto: sql<string>`CONCAT('','')`,
  };
}
