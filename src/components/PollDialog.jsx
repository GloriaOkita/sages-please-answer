import { useState } from "react";
import ModalShell from "./ModalShell.jsx";
import { PlusIcon, TrashIcon } from "./icons.jsx";
import { validatePoll } from "../utils/moments.js";

const emptyPoll = () => ({
  question: "",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
  ],
});

function normalizeOptions(options) {
  return options.map((option, index) => ({
    ...option,
    id: String.fromCharCode(65 + index),
  }));
}

export default function PollDialog({ initialPoll, onClose, onComplete }) {
  const [poll, setPoll] = useState(() =>
    initialPoll
      ? {
          question: initialPoll.question,
          options: initialPoll.options.map((option) => ({ ...option })),
        }
      : emptyPoll(),
  );
  const validation = validatePoll(poll);

  const setOption = (index, text) => {
    setPoll((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    }));
  };

  const addOption = () => {
    setPoll((current) => {
      if (current.options.length >= 4) return current;
      return {
        ...current,
        options: [
          ...current.options,
          { id: String.fromCharCode(65 + current.options.length), text: "" },
        ],
      };
    });
  };

  const removeOption = (index) => {
    setPoll((current) => {
      if (current.options.length <= 2) return current;
      return {
        ...current,
        options: normalizeOptions(current.options.filter((_, optionIndex) => optionIndex !== index)),
      };
    });
  };

  return (
    <ModalShell title="投票" onClose={onClose} className="poll-modal">
      <div className="modal__body poll-modal__body">
        <label className="poll-question-field">
          <span>投票问题</span>
          <textarea
            aria-label="投票问题"
            rows="2"
            value={poll.question}
            onChange={(event) => setPoll({ ...poll, question: event.target.value })}
            placeholder="请填写投票问题"
          />
        </label>

        <div className="poll-option-editor">
          {poll.options.map((option, index) => (
            <div className="poll-option-input" key={option.id}>
              <span className="option-letter">{option.id}</span>
              <input
                aria-label={`选项 ${option.id}`}
                value={option.text}
                onChange={(event) => setOption(index, event.target.value)}
                placeholder={`选项 ${index + 1}`}
              />
              {poll.options.length > 2 ? (
                <button
                  className="icon-button remove-option"
                  type="button"
                  onClick={() => removeOption(index)}
                  aria-label={`删除选项 ${option.id}`}
                >
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {poll.options.length < 4 ? (
          <button className="add-option" type="button" onClick={addOption} aria-label="添加选项">
            <PlusIcon size={22} />
            添加选项
          </button>
        ) : (
          <p className="option-limit">最多设置 4 个选项</p>
        )}
      </div>
      <footer className="modal__footer">
        <button className="secondary-pill" type="button" onClick={onClose}>
          取消
        </button>
        <button
          className="primary-pill"
          type="button"
          disabled={!validation.valid}
          onClick={() => onComplete(poll)}
          aria-label="完成投票"
        >
          完成
        </button>
      </footer>
    </ModalShell>
  );
}
