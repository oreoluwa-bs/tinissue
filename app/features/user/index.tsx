import { eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { users } from "~/db/schema/users";
import { userSelect } from "./utils";

export async function getUserProfile(userId: number) {
  const userRows = await db
    .select(userSelect(users))
    .from(users)
    .where(eq(users.id, userId));

  const user = userRows[0];

  return user;
}
