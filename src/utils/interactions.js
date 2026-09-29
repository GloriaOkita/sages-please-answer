const INTERACTION_TYPES = new Set(["rebuttal", "agreement", "question", "aside"]);

export function sanitizeDirectedInteractions(output, comments, participants) {
  const participantIds = new Set(participants.map(({ id }) => id));
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const replyCounts = new Map();
  const sanitized = [];

  for (const candidate of output?.interactions ?? []) {
    const target = commentById.get(candidate.toCommentId);
    const authorId = candidate.fromCharacterId;
    const targetId = target?.characterId;
    const count = replyCounts.get(authorId) ?? 0;
    const isBuddhaArgument = authorId === "buddha" && candidate.type === "rebuttal";

    if (
      !participantIds.has(authorId) ||
      !target ||
      !participantIds.has(targetId) ||
      authorId === targetId ||
      !INTERACTION_TYPES.has(candidate.type) ||
      !candidate.content?.trim() ||
      count >= 2 ||
      isBuddhaArgument
    ) {
      continue;
    }

    replyCounts.set(authorId, count + 1);
    sanitized.push({
      id: `interaction_${authorId}_${candidate.toCommentId}_${count + 1}`,
      parentCommentId: candidate.toCommentId,
      type: "character_interaction",
      interactionType: candidate.type,
      characterId: authorId,
      targetCharacterId: targetId,
      strength: Math.max(1, Math.min(3, Number(candidate.strength) || 1)),
      matchedIdeas: Array.isArray(candidate.matchedIdeas)
        ? candidate.matchedIdeas.slice(0, 4)
        : [],
      content: candidate.content.trim(),
    });
  }

  return sanitized;
}

export function sanitizeInteractionPlans(output, comments, participants) {
  const participantIds = new Set(participants.map(({ id }) => id));
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const candidates = [];

  for (const [index, candidate] of (output?.interactions ?? []).entries()) {
    const target = commentById.get(candidate.toCommentId);
    const authorId = candidate.fromCharacterId;
    const targetId = target?.characterId;
    if (
      !participantIds.has(authorId) ||
      !target ||
      authorId === targetId ||
      !INTERACTION_TYPES.has(candidate.type) ||
      (authorId === "buddha" && candidate.type === "rebuttal")
    ) {
      continue;
    }
    candidates.push({
      fromCharacterId: authorId,
      toCommentId: target.id,
      toCharacterId: targetId,
      type: candidate.type,
      strength: Math.max(1, Math.min(3, Number(candidate.strength) || 1)),
      matchedIdeas: Array.isArray(candidate.matchedIdeas) ? candidate.matchedIdeas.slice(0, 4) : [],
      _index: index,
    });
  }

  // One post gets one focused debate: the strongest semantic reaction wins.
  return candidates
    .sort((left, right) => right.strength - left.strength || left._index - right._index)
    .slice(0, 1)
    .map(({ _index, ...plan }) => plan);
}
