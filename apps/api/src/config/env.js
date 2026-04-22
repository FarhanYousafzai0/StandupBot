import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required (see apps/api/.env.example)"),
  /** Standard (non-SRV) URI from Atlas. When set, used instead of MONGODB_URI to avoid `querySrv` issues. */
  MONGODB_URI_DIRECT: z.string().optional().default(""),
  JWT_SECRET: z
    .string()
    .min(8, "JWT_SECRET must be at least 8 characters"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  /** OpenAI API key (ChatGPT). Optional at boot; standup generation fails with 503 if missing. */
  OPENAI_API_KEY: z.string().optional().default(""),
  /** Model id, e.g. gpt-4o-mini, gpt-4o, gpt-4.1 */
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  /** Base URL of this API (OAuth callback, links). e.g. http://localhost:5000 in dev */
  API_PUBLIC_URL: z.string().url().default("http://localhost:5000"),
  /** GitHub OAuth (Phase 6). Optional — integrations disabled when empty */
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  /** Slack OAuth (bot — chat:write, im:write, users:read). Optional when empty */
  SLACK_CLIENT_ID: z.string().optional().default(""),
  SLACK_CLIENT_SECRET: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid or missing environment variables. Fix your .env in apps/api (see .env.example)."
  );
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const data = parsed.data;
const direct = data.MONGODB_URI_DIRECT?.trim() ?? "";
/** The URI passed to Mongoose: direct string when set, otherwise MONGODB_URI. */
const mongoConnectUri = direct.length > 0 ? direct : data.MONGODB_URI;

export const env = { ...data, mongoConnectUri };
