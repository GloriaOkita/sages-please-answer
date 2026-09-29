export const LEGACY_CHARACTER_IDS = Object.freeze({
  placeholder_1: "luxun",
  placeholder_2: "wuzetian",
  placeholder_3: "nietzsche",
  lu_xun: "luxun",
  wu_zetian: "wuzetian",
  shakyamuni: "buddha",
  qin_shihuang: "yingzheng",
  li_bai: "libai",
  karl_marx: "marx",
  benjamin_franklin: "franklin",
  wang_yangming: "wangyangming",
  simone_de_beauvoir: "beauvoir",
  eileen_chang: "zhangailing",
  albert_einstein: "einstein",
});

export function normalizeCharacterId(id) {
  return LEGACY_CHARACTER_IDS[id] ?? id;
}

function migrateReply(reply) {
  return {
    ...reply,
    characterId: reply.characterId ? normalizeCharacterId(reply.characterId) : reply.characterId,
    targetCharacterId: reply.targetCharacterId
      ? normalizeCharacterId(reply.targetCharacterId)
      : reply.targetCharacterId,
  };
}

function migrateComment(comment) {
  return {
    ...comment,
    characterId: normalizeCharacterId(comment.characterId),
    replies: (comment.replies ?? []).map(migrateReply),
  };
}

function migrateInteractions(interactions = {}) {
  return {
    likes: (interactions.likes ?? []).map(normalizeCharacterId),
    votes: (interactions.votes ?? []).map((vote) => ({
      ...vote,
      characterId: normalizeCharacterId(vote.characterId),
    })),
    comments: (interactions.comments ?? []).map(migrateComment),
    ...(Object.hasOwn(interactions, "replies")
      ? { replies: (interactions.replies ?? []).map(migrateReply) }
      : {}),
  };
}

export function migratePersistedPosts(posts = []) {
  return posts.map((post) => ({
    ...post,
    mentionedCharacterIds: (post.mentionedCharacterIds ?? []).map(normalizeCharacterId),
    participantIds: (post.participantIds ?? []).map(normalizeCharacterId),
    visibleInteractions: migrateInteractions(post.visibleInteractions),
    pendingInteractions: migrateInteractions(post.pendingInteractions),
  }));
}
