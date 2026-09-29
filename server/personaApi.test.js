import { describe, expect, it, vi } from "vitest";
import { createPersonaHandler } from "./personaApi.js";

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

describe("local persona API", () => {
  it("forwards only allowed tasks to OneAPI and returns parsed JSON", async () => {
    const invokeModel = vi.fn().mockResolvedValue({ characterId: "luxun", comment: "针对问题的回答" });
    const handler = createPersonaHandler({ invokeModel });
    const response = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          task: "persona_main_comment",
          systemPrompt: "鲁迅人物卡",
          userMessage: "具体问题",
          history: [],
        },
      },
      response,
    );
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ characterId: "luxun", comment: "针对问题的回答" });
    expect(invokeModel).toHaveBeenCalledWith(expect.objectContaining({ task: "persona_main_comment" }));
  });

  it("rejects unknown tasks and oversized requests", async () => {
    const handler = createPersonaHandler({ invokeModel: vi.fn() });
    const unknown = createResponse();
    await handler({ method: "POST", body: { task: "steal_secrets" } }, unknown);
    expect(unknown.statusCode).toBe(400);

    const oversized = createResponse();
    await handler(
      { method: "POST", body: { task: "persona_main_comment", systemPrompt: "x".repeat(80000), userMessage: "q" } },
      oversized,
    );
    expect(oversized.statusCode).toBe(413);
  });
});
