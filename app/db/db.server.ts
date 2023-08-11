import { drizzle } from "drizzle-orm/mysql2";
// import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2";
import { env } from "~/env";

const connection = mysql.createConnection(env.DATABASE_URL);

export const db = drizzle(connection);

// migrate(db, { migrationsFolder: "app/db/migrations" })
//   .then(() => {
//     console.log("Migrated successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//     process.exit(0);
//   });
