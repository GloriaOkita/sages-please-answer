import { useEffect, useRef } from "react";
import TopBar from "./TopBar.jsx";
import PostCard from "./PostCard.jsx";
import { CommentIcon, FriendsIcon, RefreshIcon } from "./icons.jsx";
import { useEdgeSwipe } from "../hooks/useEdgeSwipe.js";
import { assetPath } from "../utils/assetPath.js";

export default function FeedPage({
  active = true,
  posts,
  characters,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onCompose,
  onRefresh,
  refreshing,
  onToggleLike,
  onReply,
  onOpenFriends,
  highlightedCommentId,
}) {
  const menuRef = useRef(null);
  const edgeSwipe = useEdgeSwipe(onOpenFriends);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) onCloseMenu();
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen, onCloseMenu]);

  return (
    <main
      className={`app-canvas feed-page${active ? "" : " feed-page--parked"}`}
      aria-hidden={!active}
      inert={active ? undefined : ""}
      {...edgeSwipe}
    >
      <div className="feed-header-wrap" ref={menuRef}>
        <TopBar title="朋友圈" onMenu={onToggleMenu} menuOpen={menuOpen} />
        {menuOpen ? (
          <div className="moments-menu" role="menu">
            <span className="moments-menu__pointer" />
            <button type="button" role="menuitem" onClick={onCompose}>
              <CommentIcon size={23} />
              发布朋友圈
            </button>
            <button type="button" role="menuitem" onClick={onRefresh}>
              <RefreshIcon size={23} spinning={refreshing} />
              刷新朋友圈
            </button>
          </div>
        ) : null}
      </div>

      <section className="profile-cover" aria-label="我的朋友圈封面">
        <img
          className="profile-cover__image"
          src={assetPath("/assets/user/cover.svg")}
          alt="我的固定朋友圈背景"
          loading="eager"
          fetchpriority="high"
        />
        <div className="profile-cover__identity">
          <strong>我</strong>
          <img src={assetPath("/assets/user/avatar.jpg")} alt="我的固定头像" loading="eager" fetchpriority="high" />
        </div>
      </section>

      <button
        className="friend-drawer-handle"
        data-shell-direction="outward"
        type="button"
        onClick={onOpenFriends}
        aria-label="打开好友列表"
      >
        <FriendsIcon />
        <span>好友</span>
      </button>

      <section className="feed-list" aria-label="朋友圈动态">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              characters={characters}
              onToggleLike={(commentId) => onToggleLike(post.id, commentId)}
              onReply={(commentId, characterId) => onReply(post.id, commentId, characterId)}
              highlightedCommentId={highlightedCommentId}
            />
          ))
        ) : (
          <div className="feed-empty">
            <div className="feed-empty__rings"><span /><span /><span /></div>
            <h2>把问题交给时间</h2>
            <p>点右上角 +，问古人一个问题。</p>
            <button type="button" onClick={onCompose}>发布第一条朋友圈</button>
          </div>
        )}
      </section>
    </main>
  );
}
