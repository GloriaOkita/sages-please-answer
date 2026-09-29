import { useState } from "react";
import { CloseIcon, SearchIcon } from "./icons.jsx";

export default function FriendDrawer({ characters, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = characters.filter((character) => character.name.includes(query.trim()));

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="friend-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="好友列表"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="friend-drawer__header">
          <h2>好友</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭好友列表">
            <CloseIcon />
          </button>
        </header>
        <label className="search-field friend-drawer__search">
          <SearchIcon />
          <span className="sr-only">搜索好友</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索好友"
          />
        </label>
        <div className="friend-drawer__count">14 位跨时空好友</div>
        <div className="friend-drawer__list">
          {filtered.map((character) => (
            <button
              className="drawer-friend"
              key={character.id}
              type="button"
              onClick={() => onSelect(character.id)}
              aria-label={`查看${character.name}`}
            >
              <img src={character.avatar} alt="" />
              <span>
                <strong>{character.name}</strong>
                <small>{character.signature}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
