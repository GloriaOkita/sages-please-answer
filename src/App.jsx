import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import characters from "./data/characters.json";
import FeedPage from "./components/FeedPage.jsx";
import ComposerPage from "./components/ComposerPage.jsx";
import ReplyDialog from "./components/ReplyDialog.jsx";
import FriendDrawer from "./components/FriendDrawer.jsx";
import FriendPreviewPage from "./components/FriendPreviewPage.jsx";
import FriendMomentsPage from "./components/FriendMomentsPage.jsx";
import Toast from "./components/Toast.jsx";
import { callAI } from "./services/callAI.js";
import {
  buildDirectorRequest,
  generateInteractionReply,
  generateMainComment,
  generateUserReply,
} from "./services/personaRuntime.js";
import { usePersistedMoments } from "./hooks/usePersistedMoments.js";
import {
  completePostGeneration,
  createPost,
  queueUserReply,
  revealPending,
  toggleCommentLike,
  validatePoll,
} from "./utils/moments.js";
import { selectParticipants } from "./utils/participants.js";
import { sanitizeInteractionPlans } from "./utils/interactions.js";
import { assetPath } from "./utils/assetPath.js";

export default function App() {
  const [page, setPage] = useState("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [friendDrawerOpen, setFriendDrawerOpen] = useState(false);
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState("");
  const [posts, setPosts] = usePersistedMoments();
  const refreshRequestedRef = useRef(false);
  const generatingPostIdsRef = useRef(new Set());

  const resolvedCharacters = useMemo(
    () => characters.map((character) => ({
      ...character,
      avatar: assetPath(character.avatar),
      moments: character.moments.map((moment) => ({ ...moment, image: assetPath(moment.image) })),
    })),
    [],
  );

  const characterById = useMemo(
    () => Object.fromEntries(resolvedCharacters.map((character) => [character.id, character])),
    [resolvedCharacters],
  );

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const generatePostInteractions = useCallback(async ({ postId, draft, participants }) => {
    if (generatingPostIdsRef.current.has(postId)) return;
    generatingPostIdsRef.current.add(postId);
    try {
      const mainResults = await Promise.all(
        participants.map((character) =>
          generateMainComment({ character, post: draft, ai: callAI }),
        ),
      );
      const comments = mainResults.map((result, index) => ({
        id: `${postId}_comment_${index + 1}`,
        characterId: result.characterId,
        content: result.comment,
        commentTags: result.commentTags,
      }));
      const directorRequest = buildDirectorRequest({ post: draft, participants, comments });
      const directorOutput = await callAI(
        directorRequest.systemPrompt,
        directorRequest.userMessage,
        [],
        "interaction_director",
      );
      const plans = sanitizeInteractionPlans(directorOutput, comments, participants);
      const commentsById = Object.fromEntries(comments.map((comment) => [comment.id, comment]));
      const participantsById = Object.fromEntries(
        participants.map((character) => [character.id, character]),
      );
      const directedReplies = (
        await Promise.all(
          plans.map(async (plan, index) => {
            const challenger = participantsById[plan.fromCharacterId];
            const originalAuthor = participantsById[plan.toCharacterId];
            const originalComment = commentsById[plan.toCommentId];
            const challenge = await generateInteractionReply({
              character: challenger,
              targetCharacter: originalAuthor,
              targetComment: originalComment,
              post: draft,
              plan,
              round: "challenge",
              ai: callAI,
            });
            const defense = await generateInteractionReply({
              character: originalAuthor,
              targetCharacter: challenger,
              targetComment: { content: challenge.content },
              originalComment,
              post: draft,
              plan: { ...plan, type: "defense" },
              round: "defense",
              ai: callAI,
            });
            const threadId = `thread_${postId}_${index + 1}`;
            return [
              {
                id: `${threadId}_challenge`,
                threadId,
                round: "challenge",
                parentCommentId: plan.toCommentId,
                type: "character_interaction",
                interactionType: plan.type,
                characterId: plan.fromCharacterId,
                targetCharacterId: plan.toCharacterId,
                strength: plan.strength,
                matchedIdeas: plan.matchedIdeas,
                content: challenge.content,
              },
              {
                id: `${threadId}_defense`,
                threadId,
                round: "defense",
                parentCommentId: plan.toCommentId,
                type: "character_interaction",
                interactionType: "defense",
                characterId: plan.toCharacterId,
                targetCharacterId: plan.fromCharacterId,
                strength: plan.strength,
                matchedIdeas: plan.matchedIdeas,
                content: defense.content,
              },
            ];
          }),
        )
      ).flat();
      const interactions = {
        likes: mainResults.filter(({ likesPost }) => likesPost).map(({ characterId }) => characterId),
        votes: mainResults
          .filter(({ vote }) => vote)
          .map(({ characterId, vote }) => ({ characterId, optionId: vote })),
        comments,
        replies: directedReplies,
      };
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? refreshRequestedRef.current
              ? revealPending(completePostGeneration(item, interactions)).post
              : completePostGeneration(item, interactions)
            : item,
        ),
      );
    } catch {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId ? { ...item, generationStatus: "failed" } : item,
        ),
      );
    } finally {
      generatingPostIdsRef.current.delete(postId);
    }
  }, [setPosts]);

  const retryGeneration = useCallback((post) => {
    const participants = post.participantIds
      .map((id) => characterById[id])
      .filter(Boolean);
    if (!participants.length) return;
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id ? { ...item, generationStatus: "generating" } : item,
      ),
    );
    void generatePostInteractions({
      postId: post.id,
      draft: {
        content: post.content,
        mentionedCharacterIds: post.mentionedCharacterIds,
        poll: post.poll,
      },
      participants,
    });
  }, [characterById, generatePostInteractions, setPosts]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const interruptedPosts = posts.filter(
      (post) =>
        post.generationStatus === "generating" &&
        !(post.pendingInteractions?.comments?.length),
    );
    for (const post of interruptedPosts) {
      const participants = post.participantIds
        .map((id) => characterById[id])
        .filter(Boolean);
      if (!participants.length) continue;
      void generatePostInteractions({
        postId: post.id,
        draft: {
          content: post.content,
          mentionedCharacterIds: post.mentionedCharacterIds,
          poll: post.poll,
        },
        participants,
      });
    }
  // Recover only the generating posts loaded at mount; normal publishing starts its own job.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = async (draft) => {
    if (!draft.content.trim() || publishing) return;
    const pollValidation = validatePoll(draft.poll);
    if (!pollValidation.valid) {
      showToast(pollValidation.reason);
      return;
    }

    setPublishing(true);
    const participants = selectParticipants(resolvedCharacters, draft.mentionedCharacterIds);
    const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const generatingPost = createPost(
      { ...draft, participantIds: participants.map(({ id }) => id) },
      { likes: [], votes: [], comments: [], replies: [] },
      new Date(),
      postId,
      "generating",
    );
    setPosts((current) => [generatingPost, ...current]);
    setPage("feed");
    setPublishing(false);
    showToast("已发布。人物正在阅读，稍后刷新朋友圈看看");

    void generatePostInteractions({ postId, draft, participants });
  };

  const handleRefresh = () => {
    setMenuOpen(false);
    setRefreshing(true);
    refreshRequestedRef.current = true;
    for (const post of posts) {
      if (post.generationStatus === "failed") retryGeneration(post);
    }
    const results = posts.map((post) => revealPending(post));
    const total = results.reduce((sum, result) => sum + result.revealedCount, 0);
    setPosts(results.map((result) => result.post));
    window.setTimeout(() => setRefreshing(false), 420);
    showToast(total ? `收到 ${total} 条来自历史的回应` : "还没有新的回应，再等等吧");
  };

  const handleToggleLike = (postId, commentId) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? toggleCommentLike(post, commentId) : post,
      ),
    );
  };

  const handleOpenReply = (postId, commentId, characterId) => {
    setReplyTarget({ postId, commentId, characterId });
  };

  const getCharacterConversation = (post, commentId, characterId) => {
    const comment = post?.visibleInteractions.comments.find(({ id }) => id === commentId);
    return (comment?.replies ?? [])
      .filter(
        (reply) =>
          (reply.type === "user_reply" && reply.targetCharacterId === characterId) ||
          (reply.type === "character_reply" && reply.characterId === characterId),
      )
      .slice(-6)
      .map((reply) => ({
        role: reply.type === "user_reply" ? "user" : "assistant",
        content: reply.content,
      }));
  };

  const openFriendPreview = (characterId) => {
    setFriendDrawerOpen(false);
    setActiveCharacterId(characterId);
    setPage("friendPreview");
  };

  const handleBackToComment = (postId, commentId) => {
    setPage("feed");
    setHighlightedCommentId(commentId);
    window.setTimeout(() => {
      const element = document.getElementById(`comment-${commentId}`);
      if (typeof element?.scrollIntoView === "function") {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
    window.setTimeout(() => setHighlightedCommentId(null), 2200);
  };

  const handleSendReply = async (text) => {
    if (!replyTarget) return;
    const character = characterById[replyTarget.characterId];
    const post = posts.find(({ id }) => id === replyTarget.postId);
    const userTurnCount = (post?.conversationCounts?.[replyTarget.characterId] ?? 0) + 1;
    const history = getCharacterConversation(
      post,
      replyTarget.commentId,
      replyTarget.characterId,
    );
    const characterReply = await generateUserReply({
      character,
      post,
      userMessage: text,
      history,
      userTurnCount,
      ai: callAI,
    });
    setPosts((current) =>
      current.map((post) =>
        post.id === replyTarget.postId
          ? queueUserReply(post, replyTarget.commentId, text, characterReply)
          : post,
      ),
    );
    setReplyTarget(null);
    showToast("你的回复已发出。刷新朋友圈看看 TA 怎么说");
  };

  return (
    <div className="site-shell">
      <FeedPage
        active={page === "feed"}
        posts={posts}
        characters={resolvedCharacters}
        menuOpen={page === "feed" && menuOpen}
        refreshing={refreshing}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
        onCompose={() => {
          setMenuOpen(false);
          setPage("composer");
        }}
        onRefresh={handleRefresh}
        onToggleLike={handleToggleLike}
        onReply={handleOpenReply}
        onOpenFriends={() => setFriendDrawerOpen(true)}
        highlightedCommentId={highlightedCommentId}
      />

      {page === "composer" ? (
        <ComposerPage
          characters={resolvedCharacters}
          onCancel={() => setPage("feed")}
          onPublish={handlePublish}
          onToast={showToast}
          publishing={publishing}
        />
      ) : page === "friendPreview" ? (
        <FriendPreviewPage
          character={characterById[activeCharacterId]}
          onBack={() => setPage("feed")}
          onOpenMoments={() => setPage("friendMoments")}
        />
      ) : page === "friendMoments" ? (
        <FriendMomentsPage
          character={characterById[activeCharacterId]}
          latestPost={posts.find((post) =>
            post.visibleInteractions.comments.some(
              ({ characterId }) => characterId === activeCharacterId,
            ),
          )}
          onBack={() => setPage("friendPreview")}
          onBackToComment={handleBackToComment}
        />
      ) : null}

      {friendDrawerOpen ? (
        <FriendDrawer
          characters={resolvedCharacters}
          onClose={() => setFriendDrawerOpen(false)}
          onSelect={openFriendPreview}
        />
      ) : null}

      {replyTarget ? (
        <ReplyDialog
          character={characterById[replyTarget.characterId]}
          onClose={() => setReplyTarget(null)}
          onSend={handleSendReply}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  );
}
