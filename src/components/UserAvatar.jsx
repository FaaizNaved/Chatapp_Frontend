function ConversationGlyph({ symbol }) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  if (symbol === "group") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (symbol === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  }

  if (symbol === "briefcase") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (symbol === "megaphone") {
    return (
      <svg {...commonProps}>
        <path d="M3 11v2a2 2 0 0 0 2 2h2l4 4V5L7 9H5a2 2 0 0 0-2 2Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    );
  }

  if (symbol === "lightning") {
    return (
      <svg {...commonProps}>
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
    );
  }

  if (symbol === "clock") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }

  return null;
}

const KNOWN_GLYPHS = ["group", "calendar", "briefcase", "megaphone", "lightning", "clock"];

export default function UserAvatar({
  name,
  color,
  symbol,
  imageUrl,
  size = 42,
  fontSize = 17,
  className = "",
  title
}) {
  // Always produce exactly 2 uppercase chars as fallback
  const raw = (name || "").replace(/[^A-Za-z0-9]/g, "");
  const fallback = raw.length >= 2
    ? raw.slice(0, 2).toUpperCase()
    : raw.length === 1
      ? (raw + raw).toUpperCase()
      : "??";

  const isGlyph = !imageUrl && KNOWN_GLYPHS.includes(symbol);

  return (
    <div
      className={`avatar-circle ${className}`.trim()}
      style={{ width: size, height: size, background: color || "var(--accent)", fontSize }}
      title={title || name}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name || "avatar"} className="avatar-image" />
      ) : isGlyph ? (
        <ConversationGlyph symbol={symbol} />
      ) : (
        <span>{symbol || fallback}</span>
      )}
    </div>
  );
}
