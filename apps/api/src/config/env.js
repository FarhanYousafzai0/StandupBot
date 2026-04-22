import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required (e.g. mongodb://127.0.0.1:27017/standupbot)"),
  JWT_SECRET: z
    .string()
    .min(8, "JWT_SECRET must be at least 8 characters"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid or missing environment variables. Fix your .env in apps/api (see .env.example)."
  );
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
