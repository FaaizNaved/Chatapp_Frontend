import { useEffect, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";

/* ── Icons ──────────────────────────────────────────────── */
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:18,height:18}}>
    <circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>
  </svg>
);

/* ── Double-tick SVG read-receipt icons ─────────────────── */
// Single tick (sent)
const TickSent = () => (
  <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:9}}>
    <polyline points="1,5 5,9 15,1"/>
  </svg>
);

// Double tick (delivered or read) — colour passed via stroke
function TickDouble({ read }) {
  const color = read ? "var(--accent-strong)" : "currentColor";
  return (
    <svg viewBox="0 0 22 10" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:9}}>
      <polyline points="1,5 5,9 15,1" stroke={color}/>
      <polyline points="7,5 11,9 21,1" stroke={color}/>
    </svg>
  );
}

/* ── Info icon ───────────────────────────────────────────── */
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Image Lightbox ──────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);
  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,0.88)",
        backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}
    >
      <img
        src={src} alt={alt || "attachment"}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth:"92vw", maxHeight:"88vh", borderRadius:12, boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}
      />
      <button onClick={onClose}
        style={{ position:"absolute", top:16, right:20, background:"rgba(255,255,255,0.12)",
          border:"none", borderRadius:"50%", width:40, height:40, fontSize:"1.2rem",
          color:"white", display:"grid", placeItems:"center" }}
        aria-label="Close"
      >✕</button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  const value = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (value.toDateString() === today.toDateString()) return "Today";
  if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
  return value.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function buildRenderList(messages) {
  const items = [];
  let lastDate = null;

  messages.forEach((message, index) => {
    const currentDate = new Date(message.created_at || message.createdAt).toDateString();
    if (currentDate !== lastDate) {
      items.push({ type: "separator", key: `sep-${currentDate}`, label: formatDate(currentDate) });
      lastDate = currentDate;
    }
    const next = messages[index + 1];
    const grouped =
      next &&
      String(next.sender_id) === String(message.sender_id) &&
      new Date(next.created_at || next.createdAt).toDateString() === currentDate;

    items.push({ type: "message", key: `msg-${message.id || index}`, message, showAvatar: !grouped });
  });

  return items;
}

function AttachmentPreview({ attachment }) {
  const [lightbox, setLightbox] = useState(false);
  const fileName = attachment.original_name || attachment.name || "file";

  if (attachment.kind === "image") {
    return (
      <>
        <img
          src={attachment.url} alt={fileName}
          className="message-attachment-image"
          style={{ cursor: "pointer" }}
          onClick={() => setLightbox(true)}
          title="Click to view full size"
        />
        {lightbox && (
          <ImageLightbox src={attachment.url} alt={fileName} onClose={() => setLightbox(false)} />
        )}
      </>
    );
  }

  if (attachment.kind === "audio") {
    return (
      <div className="message-attachment-card">
        <div className="message-attachment-title">{fileName}</div>
        <audio controls preload="metadata" className="message-audio-player">
          <source src={attachment.url} type={attachment.mime_type || "audio/webm"} />
        </audio>
      </div>
    );
  }

  if (attachment.kind === "video") {
    return (
      <div className="message-attachment-card">
        <video controls preload="metadata" className="message-video-player">
          <source src={attachment.url} type={attachment.mime_type || "video/mp4"} />
        </video>
      </div>
    );
  }

  // PDF, docx, xlsx, zip — WhatsApp-style download card
  const fileEmoji = fileName.toLowerCase().endsWith(".pdf") ? "📄"
    : fileName.match(/\.docx?$/i) ? "📝"
    : fileName.match(/\.xlsx?$/i) ? "📊"
    : fileName.match(/\.zip|\.rar/i) ? "🗜" : "📎";

  const handleDownload = (e) => {
    e.preventDefault();
    const url = attachment.url;
    if (!url) return;
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      return;
    }
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      })
      .catch(() => {
        const a = document.createElement("a");
        a.href = url; a.download = fileName; a.click();
      });
  };

  return (
    <div className="message-attachment-card" style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{fileEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
            {attachment.format || attachment.mime_type || "Document"}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          title={`Download ${fileName}`}
          style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
            background: "var(--accent,#14b8a6)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(20,184,166,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(20,184,166,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(20,184,166,0.35)"; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}


function buildHeaderStatus(selectedItem, isOnline) {
  if (selectedItem.kind === "direct") return isOnline ? "● Active now" : "○ Offline";
  if (selectedItem.kind === "discussion") {
    if (selectedItem.status === "scheduled") return `Scheduled ${new Date(selectedItem.starts_at).toLocaleString()}`;
    return selectedItem.is_active
      ? `Ends ${new Date(selectedItem.ends_at).toLocaleString()}`
      : "Discussion ended";
  }
  return `${selectedItem.member_ids?.length || 0} members`;
}

/* ── Main component ─────────────────────────────────────── */
export default function MessageArea({
  user,
  selectedItem,
  messages,
  loading,
  isOnline,
  isTyping,
  onTogglePin,
  onBackToSidebar,
  showBackButton = false
}) {
  const bottomRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setMenuOpen(false);
  }, [selectedItem]);

  if (!selectedItem) {
    return (
      <div className="messages-empty-shell">
        <div className="empty-state spacious">
          <div className="empty-state-icon">💬</div>
          <h3>Choose a chat</h3>
          <p>Select a direct chat, group, or scheduled discussion from the sidebar.</p>
        </div>
      </div>
    );
  }

  const items = buildRenderList(messages);
  const scheduledDiscussion = selectedItem.kind === "discussion" && selectedItem.status === "scheduled";
  const endedDiscussion     = selectedItem.kind === "discussion" && !selectedItem.is_active && !scheduledDiscussion;

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="message-area-header">
        <div className="header-profile">
          {showBackButton && (
            <button type="button" className="icon-btn" onClick={onBackToSidebar} aria-label="Back to chats">
              <BackIcon />
            </button>
          )}
          <div className="avatar">
            <UserAvatar
              name={selectedItem.title}
              symbol={selectedItem.avatar_symbol}
              imageUrl={selectedItem.avatar_url}
              color={selectedItem.avatar_color}
            />
            {selectedItem.kind === "direct" && (
              <span className={`avatar-badge ${isOnline ? "online" : "offline"}`} />
            )}
          </div>
          <div className="header-info">
            <div className="header-name">{selectedItem.title}</div>
            <div className={`header-status${isOnline && selectedItem.kind === "direct" ? " header-status-online" : ""}`}>
              {buildHeaderStatus(selectedItem, isOnline)}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="header-menu" style={{ position: "relative" }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More actions"
              aria-expanded={menuOpen}
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <div className="menu-dropdown header-dropdown">
                <button
                  type="button"
                  onClick={() => { onTogglePin(selectedItem); setMenuOpen(false); }}
                >
                  <PinIcon />
                  {selectedItem.pinned ? "Unpin chat" : "Pin chat"}
                </button>
                <div className="menu-divider" />
                <button
                  type="button"
                  onClick={() => { window.open("/about", "_blank"); setMenuOpen(false); }}
                >
                  <InfoIcon /> About Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <UserAvatar
              name={selectedItem.title}
              symbol={selectedItem.avatar_symbol}
              imageUrl={selectedItem.avatar_url}
              color={selectedItem.avatar_color}
              size={76} fontSize={24}
            />
            <h3>
              {scheduledDiscussion
                ? "Discussion scheduled"
                : selectedItem.kind === "discussion"
                  ? "Start the discussion"
                  : "Start the conversation"}
            </h3>
            <p>
              {scheduledDiscussion
                ? `This discussion will open on ${new Date(selectedItem.starts_at).toLocaleString()}.`
                : endedDiscussion
                  ? "This discussion is closed and can no longer receive messages."
                  : `Send the first message in ${selectedItem.title}.`}
            </p>
          </div>
        ) : (
          items.map((item) => {
            if (item.type === "separator") {
              return (
                <div key={item.key} className="date-separator">
                  <span>{item.label}</span>
                </div>
              );
            }

            const message     = item.message;
            const isSent      = String(message.sender_id) === String(user.id);
            const attachments = Array.isArray(message.attachments) ? message.attachments : [];

            return (
              <div key={item.key} className={`message-group${isSent ? " sent" : " received"}`}>
                <div className="message-row">
                  {!isSent && item.showAvatar ? (
                    <UserAvatar
                      name={message.sender_username || selectedItem.title}
                      symbol={message.sender_symbol || selectedItem.avatar_symbol}
                      imageUrl={message.sender_avatar_url}
                      color={message.sender_avatar_color || selectedItem.avatar_color}
                      size={28} fontSize={12}
                      className="mini-avatar"
                    />
                  ) : !isSent ? <div className="mini-avatar-spacer" /> : null}

                  <div className={`message-bubble${isSent ? " sent" : " received"}`}>
                    {selectedItem.kind !== "direct" && !isSent && (
                      <div className="message-author">{message.sender_username || "Member"}</div>
                    )}
                    {message.text && <div className="message-text">{message.text}</div>}
                    {attachments.length > 0 && (
                      <div className="message-attachments">
                        {attachments.map((att) => (
                          <AttachmentPreview key={`${message.id}-${att.public_id}`} attachment={att} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta: time + double-tick */}
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.created_at || message.createdAt)}</span>
                  {isSent && selectedItem.kind === "direct" && (
                    <span className="message-ticks" title={message.is_read ? "Read" : "Sent"}>
                      {message.is_read ? <TickDouble read /> : <TickSent />}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && selectedItem.kind === "direct" && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span>{selectedItem.title} is typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}
