import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import characters from "./characters.json";
import imageSources from "./momentImageSources.json";

const expectedIds = [
  "luxun",
  "wuzetian",
  "nietzsche",
  "socrates",
  "buddha",
  "yingzheng",
  "kangxi",
  "libai",
  "marx",
  "franklin",
  "wangyangming",
  "beauvoir",
  "zhangailing",
  "einstein",
];

describe("authoritative character cards", () => {
  it("uses the approved IDs and four-layer distribution", () => {
    expect(characters.map(({ id }) => id)).toEqual(expectedIds);
    expect(
      characters.reduce((groups, character) => ({
        ...groups,
        [character.group]: (groups[character.group] ?? 0) + 1,
      }), {}),
    ).toEqual({
      core_conflict: 5,
      perspective: 5,
      chinese_history: 2,
      atmosphere: 2,
    });
  });

  it("contains complete persona and three-moment contracts", () => {
    for (const character of characters) {
      expect(character).toEqual(
        expect.objectContaining({
          coreValue: expect.not.stringContaining("待补充"),
          personality: expect.not.stringContaining("待补充"),
          socialTendency: expect.not.stringContaining("待补充"),
          forbidden: expect.not.stringContaining("待补充"),
          agreeTags: expect.any(Array),
          disagreeTags: expect.any(Array),
          replyStyle: expect.not.stringContaining("待补充"),
        }),
      );
      expect(character.keywords).toHaveLength(3);
      expect(character.agreeTags.length).toBeGreaterThanOrEqual(4);
      expect(character.disagreeTags.length).toBeGreaterThanOrEqual(4);
      expect(character.moments).toHaveLength(3);
      for (const [index, moment] of character.moments.entries()) {
        expect(moment).toEqual({
          id: `${character.id}_${index + 1}`,
          date: expect.any(String),
          content: expect.any(String),
          image: `/assets/moments/${character.id}/0${index + 1}.jpg`,
          sourceId: expect.any(String),
        });
      }
    }
  });

  it("uses the approved latest signatures and IP locations", () => {
    const byId = Object.fromEntries(characters.map((character) => [character.id, character]));
    expect(byId.wuzetian.signature).toBe("无字碑上，任后人评说。");
    expect(byId.libai.signature).toBe("人生得意须尽欢。");
    expect(byId.marx.signature).toBe("改变世界，而不只是解释它。");
    expect(byId.wangyangming.ip).toBe("贵州龙场");
  });

  it("maps all 42 moments to local images with recorded sources", () => {
    const sourcePaths = new Set(imageSources.map(({ localPath }) => localPath));
    const moments = characters.flatMap(({ moments }) => moments);
    expect(moments).toHaveLength(42);
    expect(imageSources).toHaveLength(42);
    for (const moment of moments) {
      expect(sourcePaths.has(moment.image)).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", moment.image))).toBe(true);
    }
  });

  it("links every character to one unique, independently editable Markdown corpus", () => {
    const files = characters.map(({ personaFile }) => personaFile);
    expect(new Set(files).size).toBe(14);
    for (const character of characters) {
      expect(character.personaFile).toBe(`docs/人物卡/${character.id}-${character.name}.md`);
      const absolutePath = path.join(process.cwd(), character.personaFile);
      expect(existsSync(absolutePath)).toBe(true);
    }
  });
});
