import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:18789/v1";
const DEFAULT_MODEL = "gpt-5.5";

export function extractResponseText(response) {
  for (const output of response?.output ?? []) {
    for (const item of output?.content ?? []) {
      if (item?.type === "output_text" && item.text) return item.text;
    }
  }
  throw new Error("OneAPI response did not contain output text");
}

export function parseModelJson(text) {
  const cleaned = String(text ?? "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = Math.min(
      ...[cleaned.indexOf("{"), cleaned.indexOf("[")].filter((index) => index >= 0),
    );
    if (!Number.isFinite(start)) throw new Error("No JSON object in model output");
    const open = cleaned[start];
    const close = open === "{" ? "}" : "]";
    const end = cleaned.lastIndexOf(close);
    if (end <= start) throw new Error("No JSON object in model output");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function readConfiguredToken() {
  const explicit = process.env.ONEAPI_API_KEY || process.env.OPENAI_API_KEY;
  if (explicit) return explicit;
  const authPath = path.join(os.homedir(), ".codex-one", "auth.json");
  const auth = JSON.parse(await readFile(authPath, "utf8"));
  if (!auth.OPENAI_API_KEY) throw new Error("No OneAPI token configured");
  return auth.OPENAI_API_KEY;
}

export async function invokeOneAPI({
  systemPrompt,
  userMessage,
  history = [],
  task,
  fetchImpl = fetch,
}) {
  const token = await readConfiguredToken();
  const baseUrl = process.env.ONEAPI_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.ONEAPI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150000);
  try {
    const serializedUserMessage =
      typeof userMessage === "string" ? userMessage : JSON.stringify(userMessage);
    const strictJsonInstruction = `\n\n最高优先级输出要求：只输出一个合法 JSON 对象，不要 Markdown，不要解释。必须保留调用方要求的全部字段和准确字段名；不得改名、漏字段或添加替代字段。任务类型：${task}。`;
    const response = await fetchImpl(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: `${systemPrompt}${strictJsonInstruction}` },
          ...history.slice(-6).map(({ role, content }) => ({ role, content })),
          { role: "user", content: serializedUserMessage },
        ],
        max_output_tokens: task === "interaction_director" ? 900 : 420,
        store: false,
        metadata: { app: "ancient-moments", task },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OneAPI request failed (${response.status})`);
    }
    return parseModelJson(extractResponseText(payload));
  } finally {
    clearTimeout(timeout);
  }
}
