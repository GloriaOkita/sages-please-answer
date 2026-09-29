import { useState } from "react";
import ModalShell from "./ModalShell.jsx";
import { CheckIcon, SearchIcon } from "./icons.jsx";
import { toggleMention } from "../utils/moments.js";

export default function MentionDialog({ characters, initialSelected, onClose, onComplete, onLimit }) {
  const [selected, setSelected] = useState(initialSelected);
  const [query, setQuery] = useState("");
  const filtered = characters.filter((character) => character.name.includes(query.trim()));

  const handleToggle = (characterId) => {
    const result = toggleMention(selected, characterId);
    if (result.limitReached) onLimit();
    setSelected(result.selected);
  };

  return (
    <ModalShell title="@好友" onClose={onClose} className="mention-modal">
      <div className="modal__body mention-modal__body">
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">搜索好友</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索好友"
          />
        </label>
        <div className="selection-count">已选择 {selected.length}/5</div>
        <div className="friend-list">
          {filtered.map((character) => {
            const checked = selected.includes(character.id);
            const disabled = !checked && selected.length >= 5;
            return (
              <label className={`friend-row${disabled ? " friend-row--disabled" : ""}`} key={character.id}>
                <img src={character.avatar} alt="" />
                <span className="friend-row__copy">
                  <strong>{character.name}</strong>
                  <small>{character.signature}</small>
                </span>
                <input
                  className="sr-only"
                  type="checkbox"
                  aria-label={`选择${character.name}`}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => handleToggle(character.id)}
                />
                <span className={`check-control${checked ? " check-control--checked" : ""}`} aria-hidden="true">
                  {checked ? <CheckIcon /> : null}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <footer className="modal__footer modal__footer--single">
        <button className="primary-pill" type="button" onClick={() => onComplete(selected)}>
          完成选择
        </button>
      </footer>
    </ModalShell>
  );
}
