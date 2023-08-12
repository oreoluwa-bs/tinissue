import { eq, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { users } from "~/db/schema/users";

export async function getUserProfile(userId: number) {
  const userRows = await db
    .selectDistinct({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      fullName: sql`CONCAT(${users.firstName},' ', ${users.lastName})`,
      initials: sql`CONCAT(LEFT(${users.firstName}, 1),LEFT(${users.lastName}, 1))`,
      email: users.email,
      profilePhoto: sql`CONCAT('','')`,
    })
    .from(users)
    .where(eq(users.id, userId));

  const user = userRows[0];

  return user;
}
