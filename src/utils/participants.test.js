import { describe, expect, it } from "vitest";
import characters from "../data/characters.json";
import { selectParticipants } from "./participants.js";

describe("selectParticipants", () => {
  it("selects six unique people with no mentions when random targets six", () => {
    const result = selectParticipants(characters, [], () => 0);
    expect(result).toHaveLength(6);
    expect(new Set(result.map(({ id }) => id)).size).toBe(6);
  });

  it("keeps three mentions first and fills to seven from remaining people", () => {
    const mentioned = ["luxun", "wuzetian", "nietzsche"];
    const result = selectParticipants(characters, mentioned, () => 0.5);
    expect(result).toHaveLength(7);
    expect(result.slice(0, 3).map(({ id }) => id)).toEqual(mentioned);
    expect(new Set(result.map(({ id }) => id)).size).toBe(7);
  });

  it("keeps five mentions and fills to eight without duplication", () => {
    const mentioned = ["luxun", "wuzetian", "nietzsche", "marx", "franklin"];
    const result = selectParticipants(characters, mentioned, () => 0.999);
    expect(result).toHaveLength(8);
    expect(result.slice(0, 5).map(({ id }) => id)).toEqual(mentioned);
    expect(new Set(result.map(({ id }) => id)).size).toBe(8);
  });

  it("ignores invalid and duplicate mention IDs", () => {
    const result = selectParticipants(characters, ["luxun", "luxun", "missing"], () => 0);
    expect(result[0].id).toBe("luxun");
    expect(result).toHaveLength(6);
    expect(new Set(result.map(({ id }) => id)).size).toBe(6);
  });
});
