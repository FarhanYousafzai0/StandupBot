import OpenAI from "openai";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const STANDUP_SYSTEM = `You are a helpful assistant that writes daily developer standups.
Given a list of raw developer activities, output a single JSON object with exactly these string keys (use markdown with "- " bullet lines inside each string where appropriate):
- "yesterday": completed or past work (2-4 bullet points)
- "today": planned or in-progress work (2-3 bullet points; infer from open context)
- "blockers": blockers or the exact text "None"

Rules:
- Be concise, human-sounding, not robotic; developer-friendly language
- Infer "today" from context when possible
- Flag anything stuck as a blocker
- Keep total length under 150 words across all three fields combined
- Respond with valid JSON only, no markdown fences`;

/**
 * @param {Array<Record<string, unknown>>} activitiesPayload
 * @returns {Promise<{ yesterday: string; today: string; blockers: string }>}
 */
export async function generateStandupSections(activitiesPayload) {
  if (!env.OPENAI_API_KEY || !String(env.OPENAI_API_KEY).trim()) {
    throw new AppError(
      503,
      "OPENAI_NOT_CONFIGURED",
      "Set OPENAI_API_KEY in apps/api/.env to generate standups"
    );
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const userContent = `Here are my activities for today:\n${JSON.stringify(activitiesPayload, null, 2)}`;

  let text;
  try {
    const res = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: STANDUP_SYSTEM },
        { role: "user", content: userContent },
      ],
    });
    text = res.choices[0]?.message?.content;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(502, "OPENAI_ERROR", `OpenAI request failed: ${message}`);
  }

  if (!text || !text.trim()) {
    throw new AppError(502, "OPENAI_ERROR", "Empty response from model");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AppError(502, "OPENAI_ERROR", "Model did not return valid JSON");
  }

  return {
    yesterday: String(data.yesterday ?? "").trim(),
    today: String(data.today ?? "").trim(),
    blockers: String(data.blockers ?? "None").trim() || "None",
  };
}
