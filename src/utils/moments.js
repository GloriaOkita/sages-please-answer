export const EMPTY_INTERACTIONS = Object.freeze({
  likes: [],
  votes: [],
  comments: [],
});

const emptyPending = () => ({
  likes: [],
  votes: [],
  comments: [],
  replies: [],
});

const makeId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function validatePoll(poll) {
  if (!poll) return { valid: true, reason: "" };

  if (!poll.question?.trim()) {
    return { valid: false, reason: "请填写投票问题" };
  }

  if (!Array.isArray(poll.options) || poll.options.length < 2 || poll.options.length > 4) {
    return { valid: false, reason: "投票需要 2-4 个选项" };
  }

  if (poll.options.some((option) => !option.text?.trim())) {
    return { valid: false, reason: "请填写所有投票选项" };
  }

  return { valid: true, reason: "" };
}

export function toggleMention(selected, characterId, maximum = 5) {
  if (selected.includes(characterId)) {
    return {
      selected: selected.filter((id) => id !== characterId),
      limitReached: false,
    };
  }

  if (selected.length >= maximum) {
    return { selected, limitReached: true };
  }

  return { selected: [...selected, characterId], limitReached: false };
}

export function createPost(
  draft,
  interactions,
  now = new Date(),
  id = makeId("post"),
  generationStatus = "ready",
) {
  const comments = (interactions.comments ?? []).map((comment, index) => ({
    id: comment.id ?? `${id}_comment_${index + 1}`,
    type: "character_comment",
    characterId: comment.characterId,
    content: comment.content,
    likedByUser: false,
    replies: [],
  }));

  return {
    id,
    author: "me",
    content: draft.content.trim(),
    createdAt: now.toISOString(),
    mentionedCharacterIds: [...(draft.mentionedCharacterIds ?? [])],
    participantIds: [...(draft.participantIds ?? [])],
    generationStatus,
    poll: draft.poll
      ? {
          question: draft.poll.question.trim(),
          options: draft.poll.options.map((option, index) => ({
            id: String.fromCharCode(65 + index),
            text: option.text.trim(),
          })),
        }
      : null,
    visibleInteractions: {
      likes: [],
      votes: [],
      comments: [],
    },
    pendingInteractions: {
      likes: [...(interactions.likes ?? [])],
      votes: [...(interactions.votes ?? [])],
      comments,
      replies: [...(interactions.replies ?? [])],
    },
  };
}

export function completePostGeneration(post, interactions) {
  const generated = createPost(
    {
      content: post.content,
      mentionedCharacterIds: post.mentionedCharacterIds,
      participantIds: post.participantIds,
      poll: post.poll,
    },
    interactions,
    new Date(post.createdAt),
    post.id,
    "ready",
  );

  return {
    ...post,
    generationStatus: "ready",
    pendingInteractions: generated.pendingInteractions,
  };
}

export function revealPending(post) {
  const pending = post.pendingInteractions ?? emptyPending();
  const replyMap = new Map();

  for (const reply of pending.replies ?? []) {
    const existing = replyMap.get(reply.parentCommentId) ?? [];
    replyMap.set(reply.parentCommentId, [...existing, reply]);
  }

  const existingComments = post.visibleInteractions.comments.map((comment) => ({
    ...comment,
    replies: [...comment.replies, ...(replyMap.get(comment.id) ?? [])],
  }));

  const pendingComments = (pending.comments ?? []).map((comment) => ({
    ...comment,
    replies: [...(comment.replies ?? []), ...(replyMap.get(comment.id) ?? [])],
  }));
  const visibleComments = [...existingComments, ...pendingComments];
  const revealedCount =
    (pending.likes?.length ?? 0) +
    (pending.votes?.length ?? 0) +
    (pending.comments?.length ?? 0) +
    (pending.replies?.length ?? 0);

  return {
    revealedCount,
    post: {
      ...post,
      visibleInteractions: {
        likes: [...post.visibleInteractions.likes, ...(pending.likes ?? [])],
        votes: [...post.visibleInteractions.votes, ...(pending.votes ?? [])],
        comments: visibleComments,
      },
      pendingInteractions: emptyPending(),
    },
  };
}

export function queueUserReply(
  post,
  commentId,
  text,
  characterReply,
  userReplyId = makeId("reply_user"),
  characterReplyId = makeId("reply_character"),
) {
  const target = post.visibleInteractions.comments.find((comment) => comment.id === commentId);
  if (!target) return post;

  const userReply = {
    id: userReplyId,
    type: "user_reply",
    authorId: "me",
    targetCharacterId: target.characterId,
    content: text.trim(),
  };
  const pendingReply = {
    id: characterReplyId,
    parentCommentId: commentId,
    type: "character_reply",
    characterId: characterReply.characterId,
    targetUserId: "me",
    content: characterReply.content,
  };
  const conversationCounts = post.conversationCounts ?? {};

  return {
    ...post,
    conversationCounts: {
      ...conversationCounts,
      [target.characterId]: (conversationCounts[target.characterId] ?? 0) + 1,
    },
    visibleInteractions: {
      ...post.visibleInteractions,
      comments: post.visibleInteractions.comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, userReply] }
          : comment,
      ),
    },
    pendingInteractions: {
      ...(post.pendingInteractions ?? emptyPending()),
      replies: [...(post.pendingInteractions?.replies ?? []), pendingReply],
    },
  };
}

export function toggleCommentLike(post, commentId) {
  return {
    ...post,
    visibleInteractions: {
      ...post.visibleInteractions,
      comments: post.visibleInteractions.comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, likedByUser: !comment.likedByUser }
          : comment,
      ),
    },
  };
}
