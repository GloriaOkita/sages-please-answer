import TopBar from "./TopBar.jsx";
import { CommentIcon, LocationIcon } from "./icons.jsx";

export default function FriendPreviewPage({ character, onBack, onOpenMoments }) {
  return (
    <main className="app-canvas friend-preview-page">
      <TopBar title="好友资料" onBack={onBack} backLabel="返回朋友圈" />
      <section className="friend-profile-hero">
        <img className="friend-profile-hero__avatar" src={character.avatar} alt={`${character.name}头像`} />
        <div className="friend-profile-hero__copy">
          <h1>{character.name}</h1>
          <p>{character.signature}</p>
          <span><LocationIcon size={15} /> IP：{character.ip}</span>
        </div>
      </section>

      <section className="friend-profile-row">
        <div>
          <h2>人生关键词</h2>
          <div className="keyword-list">
            {character.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        </div>
      </section>

      <button className="friend-moments-preview" type="button" onClick={onOpenMoments} aria-label={`查看${character.name}的朋友圈`}>
        <strong>朋友圈</strong>
        <span className="friend-moments-preview__images">
          {character.moments.map((moment) => (
            <img key={moment.id} src={moment.image} alt={`${character.name}${moment.date}朋友圈缩略图`} />
          ))}
        </span>
        <span className="chevron">›</span>
      </button>

      <section className="friend-profile-actions">
        <button type="button" disabled aria-label="发消息">
          <CommentIcon />
          发消息
        </button>
        <small>私聊功能后续开放</small>
      </section>
    </main>
  );
}
