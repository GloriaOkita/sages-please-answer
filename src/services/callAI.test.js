import { describe, expect, it } from "vitest";
import characters from "../data/characters.json";
import { callAI } from "./callAI.js";

describe("callAI mock adapter", () => {
  it("loads the complete named friend roster in the supplied image order", () => {
    const expectedNames = [
      "鲁迅",
      "武则天",
      "尼采",
      "苏格拉底",
      "释迦牟尼",
      "嬴政",
      "康熙",
      "李白",
      "马克思",
      "富兰克林",
      "王阳明",
      "波伏娃",
      "张爱玲",
      "爱因斯坦",
    ];

    expect(characters.map((character) => character.name)).toEqual(expectedNames);
    expect(characters.map((character) => character.avatar)).toEqual(
      expectedNames.map((name) => `/assets/好友头像/${name}.jpg`),
    );
  });

  it("keeps every friend profile structurally replaceable before persona writing", () => {
    for (const character of characters) {
      expect(character).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          avatar: expect.any(String),
          signature: expect.any(String),
          ip: expect.any(String),
          keywords: expect.any(Array),
          group: expect.any(String),
          coreValue: expect.any(String),
          personality: expect.any(String),
          socialTendency: expect.any(String),
          forbidden: expect.any(String),
          moments: expect.any(Array),
        }),
      );
      expect(character.keywords).toHaveLength(3);
    }
  });

  it("stores the supplied signatures for every invited friend", () => {
    const signatures = {
      鲁迅: "从来如此，便对么？",
      武则天: "无字碑上，任后人评说。",
      尼采: "凡杀不死我的，必使我更强大。",
      苏格拉底: "我唯一知道的，就是我一无所知。",
      释迦牟尼: "一切有为法，如梦幻泡影。",
      嬴政: "天下归一，朕即天下。",
      康熙: "治天下，在务实。",
      李白: "人生得意须尽欢。",
      马克思: "改变世界，而不只是解释它。",
      富兰克林: "时间就是金钱。",
      王阳明: "知行合一。",
      波伏娃: "女人不是天生的，而是被塑造的。",
      张爱玲: "生命是一袭华美的袍，爬满了虱子。",
      爱因斯坦: "想象力比知识更重要。",
    };

    expect(Object.fromEntries(characters.map(({ name, signature }) => [name, signature]))).toEqual(
      signatures,
    );
  });

  it("builds deterministic initial interactions for selected participants and valid poll options", async () => {
    const result = await callAI(
      "占位系统提示词",
      {
        post: {
          content: "占位问题",
          poll: {
            question: "占位投票",
            options: [
              { id: "A", text: "占位 A" },
              { id: "B", text: "占位 B" },
            ],
          },
        },
        participants: characters.slice(0, 2),
      },
      [],
      "initial_interactions",
    );

    expect(result.likes).toEqual(["luxun", "wuzetian"]);
    expect(result.votes).toEqual([
      { characterId: "luxun", optionId: "B" },
      { characterId: "wuzetian", optionId: "B" },
    ]);
    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].content).toContain("占位问题");
    expect(result.comments[0].content).not.toContain("职业选择");
    expect(result.comments[0].commentTags).toEqual(["反抗", "清醒"]);
  });

  it("returns one passive reply for the requested character", async () => {
    const result = await callAI(
      "占位系统提示词",
      { character: characters[0], userMessage: "你为什么这么选？" },
      [],
      "reply_to_user",
    );

    expect(result).toEqual({
      characterId: "luxun",
      content: "鲁迅回复我：这是对「你为什么这么选？」的占位回复。",
    });
  });

  it("directs one-layer semantic interactions in one task", async () => {
    const comments = [
      { id: "comment_nietzsche", characterId: "nietzsche", content: "工作是牢笼。", commentTags: ["成为自己"] },
      { id: "comment_franklin", characterId: "franklin", content: "先行动。", commentTags: ["行动"] },
      { id: "comment_socrates", characterId: "socrates", content: "你说的工作是什么？", commentTags: ["追问"] },
    ];
    const result = await callAI(
      "导演",
      { participants: characters, comments },
      [],
      "interaction_director",
    );

    expect(result.interactions.length).toBeGreaterThan(0);
    expect(result.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromCharacterId: "franklin",
          toCommentId: "comment_nietzsche",
          type: "rebuttal",
        }),
      ]),
    );
    expect(result.interactions.every((interaction) => !("content" in interaction))).toBe(true);
  });

  it("returns the fixed cooldown after ten user turns", async () => {
    const result = await callAI(
      "人物卡",
      { character: characters[0], userMessage: "再说一句", userTurnCount: 10 },
      [],
      "reply_to_user",
    );
    expect(result.content).toBe("我已经把该说的都说了。你该问自己了。");
  });

  it("provides persona task seams through the single AI adapter", async () => {
    const main = await callAI(
      "鲁迅角色语料卡",
      JSON.stringify({ characterId: "luxun", post: { content: "工作没有热情", poll: null } }),
      [],
      "persona_main_comment",
    );
    const interaction = await callAI(
      "富兰克林角色语料卡",
      JSON.stringify({
        characterId: "franklin",
        targetCharacterId: "nietzsche",
        targetComment: "工作是牢笼",
        plan: { type: "rebuttal" },
      }),
      [],
      "persona_interaction_reply",
    );
    expect(main.characterId).toBe("luxun");
    expect(main.comment).not.toContain("占位");
    expect(interaction.characterId).toBe("franklin");
    expect(interaction.content).not.toContain("占位");
  });
});
