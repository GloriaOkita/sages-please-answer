import { describe, expect, it } from "vitest";
import { extractResponseText, invokeOneAPI, parseModelJson } from "./oneapiClient.js";

describe("OneAPI response parsing", () => {
  it("extracts output text from a Responses API payload", () => {
    expect(
      extractResponseText({
        output: [
          { type: "reasoning", content: [] },
          { type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] },
        ],
      }),
    ).toBe('{"ok":true}');
  });

  it("parses JSON inside markdown fences and surrounding prose", () => {
    expect(parseModelJson("```json\n{\"characterId\":\"luxun\",\"comment\":\"回答\"}\n```"))
      .toEqual({ characterId: "luxun", comment: "回答" });
    expect(parseModelJson("答案如下：{\"interactions\":[]}"))
      .toEqual({ interactions: [] });
  });

  it("throws a useful error for missing JSON", () => {
    expect(() => parseModelJson("没有结构化输出")).toThrow("No JSON object");
  });

  it("adds strict field-preservation instructions to model requests", async () => {
    const previousKey = process.env.ONEAPI_API_KEY;
    process.env.ONEAPI_API_KEY = "test-token";
    let requestBody;
    const fetchImpl = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }],
        }),
      };
    };
    try {
      await invokeOneAPI({
        systemPrompt: "persona",
        userMessage: { question: "具体问题", participants: ["luxun"] },
        task: "persona_main_comment",
        fetchImpl,
      });
    } finally {
      if (previousKey === undefined) delete process.env.ONEAPI_API_KEY;
      else process.env.ONEAPI_API_KEY = previousKey;
    }
    expect(requestBody.input[0].content).toContain("不得改名、漏字段");
    expect(requestBody.input[0].content).toContain("persona_main_comment");
    expect(requestBody.input.at(-1).content).toBe(
      JSON.stringify({ question: "具体问题", participants: ["luxun"] }),
    );
  });
});
