import { describe, expect, it } from "vitest";
import {
  completePostGeneration,
  createPost,
  queueUserReply,
  revealPending,
  toggleMention,
  validatePoll,
} from "./moments.js";

const validPoll = {
  question: "占位投票问题",
  options: [
    { id: "A", text: "占位选项一" },
    { id: "B", text: "占位选项二" },
  ],
};

const pending = {
  likes: ["placeholder_1", "placeholder_2"],
  votes: [
    { characterId: "placeholder_1", optionId: "A" },
    { characterId: "placeholder_2", optionId: "B" },
  ],
  comments: [
    {
      characterId: "placeholder_1",
      content: "占位人物1的占位评论",
    },
  ],
  replies: [],
};

const directedReplies = [
  {
    id: "interaction_franklin_comment_1",
    parentCommentId: "post_test_comment_1",
    type: "character_interaction",
    interactionType: "rebuttal",
    characterId: "franklin",
    targetCharacterId: "placeholder_1",
    content: "占位人物互动",
  },
];

describe("validatePoll", () => {
  it("accepts an omitted poll and complete polls with two to four options", () => {
    expect(validatePoll(null)).toEqual({ valid: true, reason: "" });
    expect(validatePoll(validPoll)).toEqual({ valid: true, reason: "" });
    expect(
      validatePoll({
        question: "四选一",
        options: ["A", "B", "C", "D"].map((id) => ({
          id,
          text: `占位选项${id}`,
        })),
      }),
    ).toEqual({ valid: true, reason: "" });
  });

  it("rejects incomplete polls and option counts outside two to four", () => {
    expect(
      validatePoll({ question: "问题", options: [{ id: "A", text: "一个" }] }),
    ).toEqual({ valid: false, reason: "投票需要 2-4 个选项" });
    expect(
      validatePoll({
        question: "问题",
        options: ["A", "B", "C", "D", "E"].map((id) => ({ id, text: id })),
      }),
    ).toEqual({ valid: false, reason: "投票需要 2-4 个选项" });
    expect(validatePoll({ ...validPoll, question: "  " })).toEqual({
      valid: false,
      reason: "请填写投票问题",
    });
    expect(
      validatePoll({
        ...validPoll,
        options: [validPoll.options[0], { id: "B", text: " " }],
      }),
    ).toEqual({ valid: false, reason: "请填写所有投票选项" });
  });
});

describe("toggleMention", () => {
  it("allows five friends, blocks a sixth, and frees a slot after deselection", () => {
    let selected = [];
    for (const id of ["1", "2", "3", "4", "5"]) {
      ({ selected } = toggleMention(selected, id));
    }

    expect(toggleMention(selected, "6")).toEqual({
      selected,
      limitReached: true,
    });

    const removed = toggleMention(selected, "3");
    expect(removed.limitReached).toBe(false);
    expect(toggleMention(removed.selected, "6").selected).toContain("6");
  });
});

describe("post interaction lifecycle", () => {
  it("can create a post immediately while interactions are still generating", () => {
    const post = createPost(
      {
        content: "工资翻倍但每天通勤四小时，要不要接受？",
        mentionedCharacterIds: [],
        participantIds: ["luxun", "franklin"],
        poll: validPoll,
      },
      { likes: [], votes: [], comments: [], replies: [] },
      new Date("2026-09-22T12:00:00.000Z"),
      "post_generating",
      "generating",
    );
    expect(post.generationStatus).toBe("generating");
    expect(post.pendingInteractions.comments).toEqual([]);
  });

  it("completes an existing generating post without replacing its visible state", () => {
    const generating = createPost(
      {
        content: "这条动态已经发布",
        mentionedCharacterIds: ["placeholder_1"],
        participantIds: ["placeholder_1", "placeholder_2"],
        poll: validPoll,
      },
      { likes: [], votes: [], comments: [], replies: [] },
      new Date("2026-09-22T12:00:00.000Z"),
      "post_generating",
      "generating",
    );
    generating.visibleInteractions.likes = ["existing_friend"];

    const completed = completePostGeneration(generating, pending);

    expect(completed.id).toBe("post_generating");
    expect(completed.generationStatus).toBe("ready");
    expect(completed.visibleInteractions.likes).toEqual(["existing_friend"]);
    expect(completed.pendingInteractions.likes).toEqual(pending.likes);
    expect(completed.pendingInteractions.comments[0]).toEqual(
      expect.objectContaining({
        id: "post_generating_comment_1",
        characterId: "placeholder_1",
      }),
    );
  });

  it("keeps generated interactions hidden until a manual refresh reveals the full batch", () => {
    const post = createPost(
      {
        content: "占位问题正文",
        mentionedCharacterIds: ["placeholder_1"],
        poll: validPoll,
      },
      pending,
      new Date("2026-09-22T12:00:00.000Z"),
      "post_test",
    );

    expect(post.visibleInteractions).toEqual({
      likes: [],
      votes: [],
      comments: [],
    });
    expect(post.pendingInteractions.comments).toHaveLength(1);

    const result = revealPending(post);
    expect(result.revealedCount).toBe(5);
    expect(result.post.visibleInteractions.likes).toEqual(pending.likes);
    expect(result.post.visibleInteractions.votes).toEqual(pending.votes);
    expect(result.post.visibleInteractions.comments).toHaveLength(1);
    expect(result.post.pendingInteractions).toEqual({
      likes: [],
      votes: [],
      comments: [],
      replies: [],
    });
  });

  it("shows the user's reply immediately but waits for refresh to reveal the character reply", () => {
    const published = createPost(
      { content: "占位问题正文", mentionedCharacterIds: [], poll: validPoll },
      pending,
      new Date("2026-09-22T12:00:00.000Z"),
      "post_test",
    );
    const visible = revealPending(published).post;
    const commentId = visible.visibleInteractions.comments[0].id;

    const queued = queueUserReply(
      visible,
      commentId,
      "这是我的追问",
      {
        characterId: "placeholder_1",
        content: "占位人物1对我的占位回复",
      },
      "reply_user",
      "reply_character",
    );

    expect(queued.visibleInteractions.comments[0].replies).toEqual([
      expect.objectContaining({
        id: "reply_user",
        type: "user_reply",
        content: "这是我的追问",
      }),
    ]);
    expect(queued.pendingInteractions.replies).toEqual([
      expect.objectContaining({
        id: "reply_character",
        parentCommentId: commentId,
        type: "character_reply",
      }),
    ]);

    const refreshed = revealPending(queued).post;
    expect(refreshed.visibleInteractions.comments[0].replies).toHaveLength(2);
    expect(refreshed.visibleInteractions.comments[0].replies[1]).toEqual(
      expect.objectContaining({
        id: "reply_character",
        type: "character_reply",
      }),
    );
  });

  it("stores participants and attaches directed character interactions to main comments", () => {
    const post = createPost(
      {
        content: "占位问题正文",
        mentionedCharacterIds: ["placeholder_1"],
        participantIds: ["placeholder_1", "franklin"],
        poll: validPoll,
      },
      { ...pending, replies: directedReplies },
      new Date("2026-09-22T12:00:00.000Z"),
      "post_test",
    );

    expect(post.participantIds).toEqual(["placeholder_1", "franklin"]);
    const refreshed = revealPending(post).post;
    expect(refreshed.visibleInteractions.comments[0].replies[0]).toEqual(
      expect.objectContaining({
        type: "character_interaction",
        characterId: "franklin",
        targetCharacterId: "placeholder_1",
      }),
    );
  });

  it("keeps a challenge and defense as exactly one back-and-forth thread", () => {
    const interactionPair = [
      {
        id: "challenge_1",
        threadId: "thread_1",
        round: "challenge",
        parentCommentId: "post_test_comment_1",
        type: "character_interaction",
        characterId: "einstein",
        targetCharacterId: "placeholder_1",
        content: "你凭什么如此确定？",
      },
      {
        id: "defense_1",
        threadId: "thread_1",
        round: "defense",
        parentCommentId: "post_test_comment_1",
        type: "character_interaction",
        characterId: "placeholder_1",
        targetCharacterId: "einstein",
        content: "我的依据在这里。",
      },
    ];
    const post = createPost(
      { content: "占位问题", mentionedCharacterIds: [], participantIds: [], poll: null },
      { ...pending, replies: interactionPair },
      new Date("2026-09-22T12:00:00.000Z"),
      "post_test",
    );
    const replies = revealPending(post).post.visibleInteractions.comments[0].replies;
    expect(replies).toHaveLength(2);
    expect(replies.map(({ round }) => round)).toEqual(["challenge", "defense"]);
    expect(new Set(replies.map(({ threadId }) => threadId)).size).toBe(1);
  });
});
