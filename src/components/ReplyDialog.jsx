import { useState } from "react";
import ModalShell from "./ModalShell.jsx";

export default function ReplyDialog({ character, onClose, onSend }) {
  const [text, setText] = useState("");

  return (
    <ModalShell title={`回复 ${character.name}`} onClose={onClose} className="reply-modal">
      <div className="modal__body reply-modal__body">
        <div className="reply-target">
          <img src={character.avatar} alt="" />
          <div>
            <strong>{character.name}</strong>
            <small>IP：{character.ip}</small>
          </div>
        </div>
        <label className="reply-field">
          <span className="sr-only">回复内容</span>
          <textarea
            aria-label="回复内容"
            autoFocus
            rows="4"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`回复 ${character.name}…`}
          />
        </label>
      </div>
      <footer className="modal__footer">
        <button className="secondary-pill" type="button" onClick={onClose}>
          取消
        </button>
        <button
          className="primary-pill"
          type="button"
          disabled={!text.trim()}
          onClick={() => onSend(text.trim())}
          aria-label="发送回复"
        >
          发送
        </button>
      </footer>
    </ModalShell>
  );
}
