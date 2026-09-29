import { describe, expect, it } from "vitest";
import { migratePersistedPosts, normalizeCharacterId } from "./legacyCharacterIds.js";
import characters from "./characters.json";

describe("legacy character ID migration", () => {
  it("maps every prior ID to the authoritative second-stage ID", () => {
    expect(normalizeCharacterId("lu_xun")).toBe("luxun");
    expect(normalizeCharacterId("wu_zetian")).toBe("wuzetian");
    expect(normalizeCharacterId("shakyamuni")).toBe("buddha");
    expect(normalizeCharacterId("qin_shihuang")).toBe("yingzheng");
    expect(normalizeCharacterId("albert_einstein")).toBe("einstein");
    expect(normalizeCharacterId("nietzsche")).toBe("nietzsche");
  });

  it("migrates mentions, participants, likes, votes, comments, and replies", () => {
    const [post] = migratePersistedPosts([
      {
        id: "post_old",
        mentionedCharacterIds: ["lu_xun", "wu_zetian"],
        participantIds: ["lu_xun", "shakyamuni"],
        visibleInteractions: {
          likes: ["lu_xun"],
          votes: [{ characterId: "qin_shihuang", optionId: "A" }],
          comments: [
            {
              id: "comment_old",
              characterId: "karl_marx",
              replies: [
                { type: "user_reply", targetCharacterId: "benjamin_franklin" },
                { type: "character_reply", characterId: "albert_einstein" },
              ],
            },
          ],
        },
        pendingInteractions: {
          likes: ["eileen_chang"],
          votes: [],
          comments: [],
          replies: [],
        },
      },
    ]);

    expect(post.mentionedCharacterIds).toEqual(["luxun", "wuzetian"]);
    expect(post.participantIds).toEqual(["luxun", "buddha"]);
    expect(post.visibleInteractions.likes).toEqual(["luxun"]);
    expect(post.visibleInteractions.votes[0].characterId).toBe("yingzheng");
    expect(post.visibleInteractions.comments[0].characterId).toBe("marx");
    expect(post.visibleInteractions.comments[0].replies[0].targetCharacterId).toBe("franklin");
    expect(post.visibleInteractions.comments[0].replies[1].characterId).toBe("einstein");
    expect(post.pendingInteractions.likes).toEqual(["zhangailing"]);
  });

  it("maps every character ID found in an old generated post to a current avatar record", () => {
    const [post] = migratePersistedPosts([
      {
        mentionedCharacterIds: ["lu_xun", "wu_zetian"],
        participantIds: ["karl_marx", "albert_einstein"],
        visibleInteractions: {
          likes: ["eileen_chang"],
          votes: [{ characterId: "qin_shihuang", optionId: "A" }],
          comments: [
            {
              id: "c1",
              characterId: "shakyamuni",
              replies: [
                { type: "character_interaction", characterId: "benjamin_franklin", targetCharacterId: "shakyamuni" },
              ],
            },
          ],
        },
        pendingInteractions: { likes: [], votes: [], comments: [], replies: [] },
      },
    ]);
    const currentIds = new Set(characters.map(({ id }) => id));
    const referenced = [
      ...post.mentionedCharacterIds,
      ...post.participantIds,
      ...post.visibleInteractions.likes,
      ...post.visibleInteractions.votes.map(({ characterId }) => characterId),
      ...post.visibleInteractions.comments.flatMap((comment) => [
        comment.characterId,
        ...comment.replies.flatMap((reply) => [reply.characterId, reply.targetCharacterId]),
      ]),
    ].filter(Boolean);
    expect(referenced.every((id) => currentIds.has(id))).toBe(true);
    expect(characters.every(({ avatar }) => avatar.startsWith("/assets/好友头像/"))).toBe(true);
  });
});
