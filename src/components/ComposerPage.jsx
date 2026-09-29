import { useState } from "react";
import TopBar from "./TopBar.jsx";
import MentionDialog from "./MentionDialog.jsx";
import PollDialog from "./PollDialog.jsx";
import { AtIcon, PollIcon } from "./icons.jsx";

export default function ComposerPage({ characters, onCancel, onPublish, onToast, publishing = false }) {
  const [content, setContent] = useState("");
  const [mentionedCharacterIds, setMentionedCharacterIds] = useState([]);
  const [poll, setPoll] = useState(null);
  const [dialog, setDialog] = useState(null);

  const canPublish = Boolean(content.trim()) && !publishing;

  return (
    <main className="app-canvas composer-page">
      <TopBar
        title="发表朋友圈"
        onBack={onCancel}
        action={
          <button
            className="publish-button"
            type="button"
            disabled={!canPublish}
            onClick={() => onPublish({ content, mentionedCharacterIds, poll })}
            aria-label="发表"
          >
            {publishing ? "生成中" : "发表"}
          </button>
        }
      />

      <section className="composer">
        <textarea
          className="composer__textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="这一刻，你想问古人什么？也可以写下你的处境。"
          autoFocus
          maxLength="800"
        />
        <div className="composer__count">{content.length}/800</div>

        {poll ? (
          <button className="poll-summary" type="button" onClick={() => setDialog("poll")}>
            <span className="poll-summary__label">投票</span>
            <strong>{poll.question}</strong>
            <small>{poll.options.map((option) => `${option.id}. ${option.text}`).join(" · ")}</small>
          </button>
        ) : null}

        <div className="composer-tools">
          <button type="button" onClick={() => setDialog("mentions")} aria-label="选择要@的好友">
            <AtIcon />
            <span>@好友</span>
            {mentionedCharacterIds.length ? <em>已选 {mentionedCharacterIds.length} 人</em> : null}
          </button>
          <button type="button" onClick={() => setDialog("poll")} aria-label="设置投票">
            <PollIcon />
            <span>投票</span>
            {poll ? <em>{poll.options.length} 个选项</em> : null}
          </button>
        </div>
      </section>

      {dialog === "mentions" ? (
        <MentionDialog
          characters={characters}
          initialSelected={mentionedCharacterIds}
          onClose={() => setDialog(null)}
          onComplete={(selected) => {
            setMentionedCharacterIds(selected);
            setDialog(null);
          }}
          onLimit={() => onToast("最多只能 @ 5 位好友")}
        />
      ) : null}

      {dialog === "poll" ? (
        <PollDialog
          initialPoll={poll}
          onClose={() => setDialog(null)}
          onComplete={(nextPoll) => {
            setPoll(nextPoll);
            setDialog(null);
          }}
        />
      ) : null}
    </main>
  );
}
