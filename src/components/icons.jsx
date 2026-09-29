export function PlusIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function BackIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function HeartIcon({ size = 22, filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        className={filled ? "icon-fill" : undefined}
        d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"
      />
    </svg>
  );
}

export function CommentIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M4 5.5h16v11H9l-5 3v-14Z" />
      <circle cx="9" cy="11" r="0.75" className="icon-fill" />
      <circle cx="12" cy="11" r="0.75" className="icon-fill" />
      <circle cx="15" cy="11" r="0.75" className="icon-fill" />
    </svg>
  );
}

export function RefreshIcon({ size = 23, spinning = false }) {
  return (
    <svg
      className={spinning ? "spin-once" : undefined}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 8.2A7 7 0 0 1 18.8 10M17.9 15.8A7 7 0 0 1 5.2 14" />
    </svg>
  );
}

export function AtIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v2.2c0 1 .8 1.8 1.8 1.8 2.2 0 3.2-2 3.2-4a9 9 0 1 0-3.3 7" />
    </svg>
  );
}

export function PollIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M4 5.5h16v11H9l-5 3v-14Z" />
      <path d="M8 14v-3M12 14V8M16 14v-5" />
    </svg>
  );
}

export function CheckIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="m6 12 4 4 8-9" />
    </svg>
  );
}

export function SearchIcon({ size = 19 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function TrashIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export function FriendsIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M14 14c3.5-.5 5.6 1.2 6.5 4" />
    </svg>
  );
}

export function LocationIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
