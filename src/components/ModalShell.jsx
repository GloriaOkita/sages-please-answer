import { CloseIcon } from "./icons.jsx";

export default function ModalShell({ title, ariaLabel = title, onClose, children, className = "" }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <span className="modal__header-spacer" />
          <h2>{title}</h2>
          <button className="icon-button modal__close" type="button" onClick={onClose} aria-label={`关闭${title}`}>
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
