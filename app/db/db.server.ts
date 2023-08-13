import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

import mysql from "mysql2";
import { env } from "~/env";

const connection = mysql.createConnection(env.DATABASE_URL);

export const db = drizzle(connection, {
  logger: env.NODE_ENV === "development",
  mode: "default",
  schema,
});
