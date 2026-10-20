export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lx-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4cf86" />
          <stop offset="1" stopColor="#ff5b2e" />
        </linearGradient>
      </defs>
      <path d="M16 1l1.6 13.4L31 16l-13.4 1.6L16 31l-1.6-13.4L1 16l13.4-1.6z" fill="url(#lx-g)" />
      <circle cx="16" cy="16" r="8.4" fill="#000" />
      <circle cx="16" cy="16" r="8.4" fill="none" stroke="#f4cf86" strokeWidth=".8" opacity=".75" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <LogoMark size={28} />
      <span className="wordmark__text">Lucivex</span>
    </span>
  );
}
