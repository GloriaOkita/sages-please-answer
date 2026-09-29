import { describe, expect, it } from "vitest";
import characters from "../data/characters.json";
import { getPersonaCard, PERSONA_IDS } from "./personaLibrary.js";

describe("personaLibrary", () => {
  it("loads all fourteen independent Markdown cards", () => {
    expect(PERSONA_IDS).toEqual(characters.map(({ id }) => id));
    for (const character of characters) {
      const card = getPersonaCard(character.id);
      expect(card).toContain(`# ${character.name}角色语料卡`);
      expect(card).toContain("## 原文语料");
      expect(card).toContain("## 可迁移语言特征");
      expect(card).toContain("## 生成策略");
      expect(card).toContain("## 输出自检");
      expect(card.length).toBeGreaterThan(700);
    }
  });

  it("throws instead of silently sharing a fallback card", () => {
    expect(() => getPersonaCard("missing-person")).toThrow("Unknown persona");
  });

});
