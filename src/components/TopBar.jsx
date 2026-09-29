import { BackIcon, PlusIcon } from "./icons.jsx";

export default function TopBar({ title, onBack, backLabel = "返回朋友圈", onMenu, action, menuOpen = false }) {
  return (
    <header className="top-bar">
      <div className="top-bar__side">
        {onBack ? (
          <button className="icon-button" type="button" onClick={onBack} aria-label={backLabel}>
            <BackIcon />
          </button>
        ) : null}
      </div>
      <h1>{title}</h1>
      <div className="top-bar__side top-bar__side--right">
        {onMenu ? (
          <button
            className={`plus-button${menuOpen ? " plus-button--active" : ""}`}
            type="button"
            onClick={onMenu}
            aria-label="打开朋友圈菜单"
            aria-expanded={menuOpen}
          >
            <PlusIcon size={25} />
          </button>
        ) : (
          action
        )}
      </div>
    </header>
  );
}
