import * as dotenv from "dotenv";
import { z, type ZodFormattedError } from "zod";

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  SESSION_SECRET: z.string(),
  JWT_SECRET: z.string(),
});

const _env = schema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_env.error.format()),
  );
  throw new Error("Invalid environment variables");
}

function formatErrors(errors: ZodFormattedError<Map<string, string>, string>) {
  return Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value)
        return `${name}: ${value._errors.join(", ")}\n`;
    })
    .filter(Boolean);
}

export const env = { ..._env.data };
