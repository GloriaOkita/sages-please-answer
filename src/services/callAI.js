import characters from "../data/characters.json";
import { mockInteractionReply, mockMainComment, mockUserReply } from "./mockPersonaVoices.js";

const characterById = Object.fromEntries(characters.map((character) => [character.id, character]));

function parsePayload(value) {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function parseDirectorPayload(value) {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function callAI(
  systemPrompt,
  userMessage,
  history = [],
  task = "initial_interactions",
) {
  const liveTasks = new Set([
    "persona_main_comment",
    "interaction_director",
    "persona_interaction_reply",
    "persona_user_reply",
  ]);
  const canUseServerAI = import.meta.env.BASE_URL === "/";
  if (canUseServerAI && liveTasks.has(task) && typeof window !== "undefined") {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemPrompt, userMessage, history, task }),
      });
      if (response.ok) return await response.json();
    } catch {
      // A character-specific local voice below keeps the demo usable offline.
    }
  }

  if (task === "persona_main_comment") {
    const payload = parsePayload(userMessage);
    const character = characterById[payload.characterId];
    if (!character) return {};
    return mockMainComment(character, payload.post ?? { content: "", poll: null });
  }

  if (task === "persona_interaction_reply") {
    const payload = parsePayload(userMessage);
    const character = characterById[payload.characterId];
    const targetCharacter = characterById[payload.targetCharacterId];
    if (!character || !targetCharacter) return {};
    return mockInteractionReply(
      character,
      targetCharacter,
      { content: payload.targetComment ?? "" },
      payload.plan,
      payload.round,
      payload.originalComment ? { content: payload.originalComment } : undefined,
    );
  }

  if (task === "persona_user_reply") {
    const payload = parsePayload(userMessage);
    const character = characterById[payload.characterId];
    if (!character) return {};
    return mockUserReply(
      character,
      payload.userMessage ?? "",
      history,
      payload.userTurnCount ?? 1,
      payload.currentQuestion ?? "",
    );
  }

  if (task === "reply_to_user") {
    const { character, userMessage: replyText, userTurnCount = 1 } = userMessage;
    return {
      characterId: character.id,
      content:
        userTurnCount >= 10
          ? "我已经把该说的都说了。你该问自己了。"
          : `${character.name}回复我：这是对「${replyText}」的占位回复。${history.length ? "我记得我们前面说过的话。" : ""}`,
    };
  }

  if (task === "interaction_director") {
    const directorPayload = parseDirectorPayload(userMessage);
    const comments = directorPayload.comments ?? [];
    const byCharacter = Object.fromEntries(comments.map((comment) => [comment.characterId, comment]));
    const interactions = [];

    if (byCharacter.franklin && byCharacter.nietzsche) {
      interactions.push({
        fromCharacterId: "franklin",
        toCommentId: byCharacter.nietzsche.id,
        toCharacterId: "nietzsche",
        type: "rebuttal",
        strength: 2,
        matchedIdeas: ["理想主义", "反抗平庸"],
      });
    }
    if (byCharacter.socrates) {
      const target = comments.find(
        (comment) => comment.characterId !== "socrates" && comment.characterId !== "buddha",
      );
      if (target) {
        interactions.push({
          fromCharacterId: "socrates",
          toCommentId: target.id,
          toCharacterId: target.characterId,
          type: "question",
          strength: 2,
          matchedIdeas: ["确定答案", "追问"],
        });
      }
    }
    if (byCharacter.libai && comments.length > 1) {
      const target = comments.find((comment) => comment.characterId !== "libai");
      interactions.push({
        fromCharacterId: "libai",
        toCommentId: target.id,
        toCharacterId: target.characterId,
        type: "aside",
        strength: 1,
        matchedIdeas: ["焦虑", "当下"],
      });
    }
    if (!interactions.length && comments.length >= 2) {
      interactions.push({
        fromCharacterId: comments[1].characterId,
        toCommentId: comments[0].id,
        toCharacterId: comments[0].characterId,
        type: "agreement",
        strength: 1,
        matchedIdeas: ["语义相关"],
      });
    }

    return { interactions };
  }

  const participants = userMessage.participants ?? [];
  const options = userMessage.post?.poll?.options ?? [];
  const results = participants.map((character) =>
    mockMainComment(character, userMessage.post ?? { content: "", poll: null }),
  );
  return {
    likes: results.filter(({ likesPost }) => likesPost).map(({ characterId }) => characterId),
    votes: options.length
      ? results
          .filter(({ vote }) => vote)
          .map(({ characterId, vote }) => ({ characterId, optionId: vote }))
      : [],
    comments: results.map(({ characterId, comment, commentTags }) => ({
      characterId,
      content: comment,
      commentTags,
    })),
    replies: [],
  };
}
