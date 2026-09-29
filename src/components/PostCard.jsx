import { CommentIcon, HeartIcon } from "./icons.jsx";
import { assetPath } from "../utils/assetPath.js";

function CharacterAvatar({ character, size = "normal", label }) {
  return (
    <img
      className={`character-avatar character-avatar--${size}`}
      src={character.avatar}
      alt={label ?? character.name}
    />
  );
}

function PollResults({ poll, votes, characterById }) {
  if (!poll) return null;

  return (
    <section className="post-poll" aria-label={`投票：${poll.question}`}>
      <h3>{poll.question}</h3>
      <div className="post-poll__options">
        {poll.options.map((option) => {
          const optionVotes = votes.filter((vote) => vote.optionId === option.id);
          return (
            <div className="post-poll__option" key={option.id}>
              <div className="post-poll__option-main">
                <span className="option-letter">{option.id}</span>
                <span>{option.text}</span>
                <strong>{optionVotes.length} 票</strong>
              </div>
              {optionVotes.length ? (
                <div className="vote-avatars">
                  {optionVotes.map((vote) => {
                    const character = characterById[vote.characterId];
                    return character ? (
                      <CharacterAvatar
                        key={vote.characterId}
                        character={character}
                        size="tiny"
                        label={`${character.name}投给了选项${option.id}`}
                      />
                    ) : null;
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CommentReplies({ replies, character, characterById }) {
  if (!replies.length) return null;

  const rendered = [];
  for (let index = 0; index < replies.length; index += 1) {
    const reply = replies[index];
    if (reply.type === "character_interaction" && reply.round === "challenge") {
      const defense = replies[index + 1];
      const challenger = characterById[reply.characterId];
      const hasDefense =
        defense?.type === "character_interaction" &&
        defense.round === "defense" &&
        defense.threadId === reply.threadId;
      rendered.push(
        <div
          className="interaction-thread"
          role="group"
          aria-label={`${character.name}与${challenger?.name ?? "好友"}的一来一回`}
          key={reply.threadId ?? reply.id}
        >
          <p>
            <strong>{challenger?.name ?? "好友"}</strong> 回复 <strong>{character.name}</strong>：{reply.content}
          </p>
          {hasDefense ? (
            <p>
              <strong>{character.name}</strong> 回复 <strong>{challenger?.name ?? "好友"}</strong>：{defense.content}
            </p>
          ) : null}
        </div>,
      );
      if (hasDefense) index += 1;
      continue;
    }
    rendered.push(
      <p key={reply.id}>
        {reply.type === "user_reply" ? (
          <><strong>我</strong> 回复 <strong>{character.name}</strong>：{reply.content}</>
        ) : reply.type === "character_interaction" ? (
          <><strong>{characterById[reply.characterId]?.name ?? "好友"}</strong> 回复 <strong>{character.name}</strong>：{reply.content}</>
        ) : (
          <><strong>{character.name}</strong> 回复 <strong>我</strong>：{reply.content}</>
        )}
      </p>,
    );
  }

  return (
    <div className="comment-replies">
      {rendered}
    </div>
  );
}

function CharacterComment({ comment, character, characterById, onToggleLike, onReply, highlighted }) {
  const openReply = () => onReply(comment.id, character.id);

  return (
    <article
      className={`character-comment${highlighted ? " character-comment--highlighted" : ""}`}
      id={`comment-${comment.id}`}
      aria-label={`${character.name}的评论`}
      data-highlighted={highlighted ? "true" : "false"}
    >
      <button className="comment-avatar-button" type="button" onClick={openReply} aria-label={`回复${character.name}`}>
        <CharacterAvatar character={character} />
      </button>
      <div className="character-comment__body">
        <button className="character-name" type="button" onClick={openReply}>
          {character.name}
        </button>
        <span className="character-ip">IP：{character.ip}</span>
        <button className="comment-copy" type="button" onClick={openReply}>
          {comment.content}
        </button>
        <CommentReplies replies={comment.replies} character={character} characterById={characterById} />
      </div>
      <div className="comment-actions">
        <button
          className={`comment-action${comment.likedByUser ? " comment-action--liked" : ""}`}
          type="button"
          onClick={() => onToggleLike(comment.id)}
          aria-label={`赞${character.name}的评论`}
          aria-pressed={comment.likedByUser}
        >
          <HeartIcon size={20} filled={comment.likedByUser} />
        </button>
        <button className="comment-action" type="button" onClick={openReply} aria-label={`评论${character.name}`}>
          <CommentIcon size={20} />
        </button>
      </div>
    </article>
  );
}

export default function PostCard({ post, characters, onToggleLike, onReply, highlightedCommentId }) {
  const characterById = Object.fromEntries(characters.map((character) => [character.id, character]));
  const { likes, votes, comments } = post.visibleInteractions;

  return (
    <article className="post-card">
      <img className="post-card__author-avatar" src={assetPath("/assets/user/avatar.jpg")} alt="我的头像" />
      <div className="post-card__content">
        <div className="post-card__author">我</div>
        <p className="post-card__text">{post.content}</p>
        {post.mentionedCharacterIds.length ? (
          <p className="post-card__mentions">
            @{post.mentionedCharacterIds.map((id) => characterById[id]?.name).filter(Boolean).join(" @")}
          </p>
        ) : null}

        <PollResults poll={post.poll} votes={votes} characterById={characterById} />

        {likes.length || comments.length ? (
          <section className="interaction-panel" aria-label="朋友圈互动">
            {likes.length ? (
              <div className="post-likes">
                <HeartIcon size={20} />
                <div className="post-likes__avatars">
                  {likes.map((characterId) => {
                    const character = characterById[characterId];
                    return character ? (
                      <CharacterAvatar
                        key={character.id}
                        character={character}
                        size="small"
                        label={`${character.name}点赞了这条朋友圈`}
                      />
                    ) : null;
                  })}
                </div>
              </div>
            ) : null}

            {comments.length ? (
              <div className="comments-list">
                {comments.map((comment) => {
                  const character = characterById[comment.characterId];
                  return character ? (
                    <CharacterComment
                      key={comment.id}
                      comment={comment}
                      character={character}
                      characterById={characterById}
                      onToggleLike={onToggleLike}
                      onReply={onReply}
                      highlighted={comment.id === highlightedCommentId}
                    />
                  ) : null;
                })}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="quiet-state">
            <span />
            {post.generationStatus === "generating"
              ? "人物正在阅读这条朋友圈…"
              : post.generationStatus === "failed"
                ? "这次回应生成失败，请重新发布试试"
              : "还没有人回应，刷新朋友圈看看"}
          </div>
        )}
      </div>
    </article>
  );
}
