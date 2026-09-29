import { describe, expect, it } from "vitest";
import { sanitizeDirectedInteractions, sanitizeInteractionPlans } from "./interactions.js";

const participants = [
  { id: "luxun" },
  { id: "nietzsche" },
  { id: "franklin" },
  { id: "socrates" },
  { id: "buddha" },
  { id: "libai" },
];

const comments = participants.map(({ id }) => ({
  id: `comment_${id}`,
  characterId: id,
  replies: [],
}));

describe("sanitizeDirectedInteractions", () => {
  it("accepts valid one-layer interactions and assigns stable parent IDs", () => {
    const result = sanitizeDirectedInteractions(
      {
        interactions: [
          {
            fromCharacterId: "franklin",
            toCommentId: "comment_nietzsche",
            toCharacterId: "nietzsche",
            type: "rebuttal",
            strength: 2,
            matchedIdeas: ["理想主义", "自我超越"],
            content: "值得做的工作，不是牢笼。",
          },
        ],
      },
      comments,
      participants,
    );

    expect(result).toEqual([
      expect.objectContaining({
        parentCommentId: "comment_nietzsche",
        characterId: "franklin",
        targetCharacterId: "nietzsche",
        type: "character_interaction",
        interactionType: "rebuttal",
      }),
    ]);
  });

  it("rejects self replies, unknown IDs, unknown types, and nested targets", () => {
    const result = sanitizeDirectedInteractions(
      {
        interactions: [
          { fromCharacterId: "luxun", toCommentId: "comment_luxun", type: "rebuttal", content: "self" },
          { fromCharacterId: "unknown", toCommentId: "comment_luxun", type: "rebuttal", content: "unknown" },
          { fromCharacterId: "luxun", toCommentId: "comment_missing", type: "rebuttal", content: "missing" },
          { fromCharacterId: "luxun", toCommentId: "comment_nietzsche", type: "fight", content: "bad type" },
          { fromCharacterId: "luxun", toCommentId: "comment_nietzsche", type: "rebuttal", content: "" },
        ],
      },
      comments,
      participants,
    );
    expect(result).toEqual([]);
  });

  it("keeps at most two replies per author and prevents Buddha rebuttals", () => {
    const candidates = ["luxun", "nietzsche", "socrates"].map((target, index) => ({
      fromCharacterId: "franklin",
      toCommentId: `comment_${target}`,
      toCharacterId: target,
      type: "rebuttal",
      strength: index + 1,
      content: `reply ${index}`,
    }));
    candidates.push({
      fromCharacterId: "buddha",
      toCommentId: "comment_nietzsche",
      toCharacterId: "nietzsche",
      type: "rebuttal",
      content: "argue",
    });

    const result = sanitizeDirectedInteractions({ interactions: candidates }, comments, participants);
    expect(result.filter(({ characterId }) => characterId === "franklin")).toHaveLength(2);
    expect(result.some(({ characterId }) => characterId === "buddha")).toBe(false);
  });
});

describe("sanitizeInteractionPlans", () => {
  it("keeps a valid relationship without requiring or returning final dialogue", () => {
    const plans = sanitizeInteractionPlans(
      {
        interactions: [
          {
            fromCharacterId: "franklin",
            toCommentId: "comment_nietzsche",
            toCharacterId: "nietzsche",
            type: "rebuttal",
            strength: 2,
            matchedIdeas: ["理想主义"],
            content: "导演不应写这句台词",
          },
        ],
      },
      comments,
      participants,
    );
    expect(plans).toEqual([
      {
        fromCharacterId: "franklin",
        toCommentId: "comment_nietzsche",
        toCharacterId: "nietzsche",
        type: "rebuttal",
        strength: 2,
        matchedIdeas: ["理想主义"],
      },
    ]);
    expect(plans[0]).not.toHaveProperty("content");
  });

  it("selects only one strongest challenger and never crowds one main comment", () => {
    const plans = sanitizeInteractionPlans(
      {
        interactions: [
          { fromCharacterId: "luxun", toCommentId: "comment_socrates", toCharacterId: "socrates", type: "rebuttal", strength: 2, matchedIdeas: ["教条"] },
          { fromCharacterId: "franklin", toCommentId: "comment_socrates", toCharacterId: "socrates", type: "rebuttal", strength: 3, matchedIdeas: ["空谈"] },
          { fromCharacterId: "nietzsche", toCommentId: "comment_socrates", toCharacterId: "socrates", type: "rebuttal", strength: 1, matchedIdeas: ["平庸"] },
          { fromCharacterId: "libai", toCommentId: "comment_luxun", toCharacterId: "luxun", type: "aside", strength: 2, matchedIdeas: ["焦虑"] },
        ],
      },
      comments,
      participants,
    );
    expect(plans).toHaveLength(1);
    expect(plans[0]).toEqual(expect.objectContaining({
      fromCharacterId: "franklin",
      toCharacterId: "socrates",
      strength: 3,
    }));
  });

  it("returns no interaction when the director has no meaningful challenge", () => {
    expect(sanitizeInteractionPlans({ interactions: [] }, comments, participants)).toEqual([]);
  });
});
