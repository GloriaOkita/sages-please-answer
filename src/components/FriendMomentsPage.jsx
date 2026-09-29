import TopBar from "./TopBar.jsx";

function CurrentQuestionContext({ character, post, onBackToComment }) {
  if (!post) return null;
  const comment = post.visibleInteractions.comments.find(({ characterId }) => characterId === character.id);
  const vote = post.visibleInteractions.votes.find(({ characterId }) => characterId === character.id);
  const option = post.poll?.options.find(({ id }) => id === vote?.optionId);

  if (!comment) return null;

  return (
    <section className="current-question-context">
      <span>TA 对你最新问题的回答</span>
      <h2>{post.content}</h2>
      <p className="current-question-context__vote">
        {option ? `本轮投票：${option.id}. ${option.text}` : "本轮未设置投票或 TA 选择不投票"}
      </p>
      <p>{comment.content}</p>
      <button type="button" onClick={() => onBackToComment(post.id, comment.id)} aria-label={`回到${character.name}的评论`}>
        回到 TA 的评论
      </button>
    </section>
  );
}

export default function FriendMomentsPage({ character, latestPost, onBack, onBackToComment }) {
  return (
    <main className="app-canvas friend-moments-page">
      <TopBar title={`${character.name}的朋友圈`} onBack={onBack} backLabel="返回好友资料" />
      <section className="friend-cover">
        <img className="friend-cover__image" src={character.moments[0].image} alt={`${character.name}的朋友圈封面`} />
        <div className="friend-cover__shade" />
        <div className="friend-cover__identity">
          <div>
            <h1>{character.name}</h1>
            <p>{character.signature}</p>
          </div>
          <img src={character.avatar} alt={`${character.name}头像`} />
        </div>
      </section>

      <section className="friend-metadata">
        <span>IP：{character.ip}</span>
        <div className="keyword-list">
          {character.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
      </section>

      <section className="moment-timeline" aria-label={`${character.name}的历史朋友圈`}>
        {character.moments.map((moment) => (
          <article className="timeline-entry" key={moment.id}>
            <time>{moment.date}</time>
            <div className="timeline-entry__content">
              <img src={moment.image} alt={`${character.name}的历史朋友圈配图：${moment.date}`} />
              <p>{moment.content}</p>
            </div>
          </article>
        ))}
      </section>

      <CurrentQuestionContext
        character={character}
        post={latestPost}
        onBackToComment={onBackToComment}
      />
    </main>
  );
}
