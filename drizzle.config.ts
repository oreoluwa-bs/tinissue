import type { Config } from "drizzle-kit";
import { env } from "~/env";

export default {
  schema: "./app/db/schema/index.ts",
  out: "./app/db/migrations",
  driver: "mysql2",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
} satisfies Config;
