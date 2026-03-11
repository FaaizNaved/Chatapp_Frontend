import { useEffect, useRef } from "react";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

/* Group consecutive messages by same sender for avatar collapsing */
function buildRenderList(messages) {
    const items = [];
    let lastDate = null;

    messages.forEach((msg, i) => {
        const date = new Date(msg.created_at || msg.createdAt).toDateString();

        // Date separator
        if (date !== lastDate) {
            items.push({ type: "separator", date, key: `sep-${date}` });
            lastDate = date;
        }

        // Show avatar only on the *last* consecutive received message from same sender
        const nextMsg = messages[i + 1];
        const isLastInGroup =
            !nextMsg ||
            String(nextMsg.sender_id) !== String(msg.sender_id) ||
            new Date(nextMsg.created_at || nextMsg.createdAt).toDateString() !== date;

        items.push({ type: "message", msg, showAvatar: isLastInGroup, key: `msg-${msg.id || i}` });
    });

    return items;
}

/* ── Small avatar circle ─────────────────────────────────────────── */
function MiniAvatar({ name, color }) {
    return (
        <div
            className="bubble-small-avatar"
            style={{ background: color || "#7c3aed" }}
            title={name}
        >
            {name ? name.slice(0, 2).toUpperCase() : "?"}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function MessageArea({ user, contact, messages, loading, isOnline, isTyping }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: messages.length === 1 ? "instant" : "smooth" });
    }, [messages, isTyping]);

    /* ── No contact selected ─────────────────────────────────────── */
    if (!contact) {
        return (
            <div style={{ flex: 1, display: "flex" }}>
                <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <h3>Welcome to ChatSphere</h3>
                    <p>Select a contact to start chatting</p>
                </div>
            </div>
        );
    }

    const items = buildRenderList(messages);

    return (
        <>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="message-area-header">
                <div className="avatar" style={{ position: "relative", flexShrink: 0 }}>
                    <div
                        className="avatar-circle"
                        style={{
                            width: 42, height: 42,
                            background: contact.avatar_color || "#7c3aed",
                            fontSize: 17, borderRadius: "50%"
                        }}
                    >
                        {contact.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                        style={{
                            position: "absolute", bottom: 1, right: 1,
                            width: 11, height: 11, borderRadius: "50%",
                            background: isOnline ? "var(--online)" : "var(--text-muted)",
                            border: "2px solid var(--bg-surface)"
                        }}
                    />
                </div>
                <div className="header-info">
                    <div className="header-name">{contact.username}</div>
                    <div className={`header-status ${isOnline ? "online-text" : ""}`}>
                        {isOnline ? "● Active now" : "○ Offline"}
                    </div>
                </div>
            </div>

            {/* ── Messages ──────────────────────────────────────────── */}
            <div className="messages-container">
                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon" style={{ fontSize: 28, width: 60, height: 60 }}>👋</div>
                        <h3>Say hello!</h3>
                        <p>Start the conversation with {contact.username}</p>
                    </div>
                ) : (
                    items.map(item => {
                        if (item.type === "separator") {
                            return (
                                <div key={item.key} className="date-separator">
                                    <span>{formatDate(item.date)}</span>
                                </div>
                            );
                        }

                        const { msg, showAvatar } = item;
                        const isSent = String(msg.sender_id) === String(user.id);
                        const dateStr = msg.created_at || msg.createdAt;

                        return (
                            <div
                                key={item.key}
                                className={`message-group ${isSent ? "sent" : "received"}`}
                            >
                                {/* Bubble row */}
                                <div className="message-row">
                                    {/* Avatar placeholder for received — keeps alignment when hidden */}
                                    {!isSent && (
                                        showAvatar
                                            ? <MiniAvatar
                                                name={msg.sender_username || contact.username}
                                                color={msg.sender_avatar_color || contact.avatar_color}
                                            />
                                            : <div style={{ width: 28, flexShrink: 0 }} />
                                    )}

                                    <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
                                        {msg.text}
                                    </div>
                                </div>

                                {/* Time + read receipt */}
                                <div className="message-meta">
                                    <span className="message-time">{formatTime(dateStr)}</span>
                                    {isSent && (
                                        <span
                                            className="message-read"
                                            title={msg.is_read ? "Read" : "Delivered"}
                                        >
                                            {msg.is_read ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="typing-indicator">
                        <MiniAvatar name={contact.username} color={contact.avatar_color} />
                        <div className="typing-dots">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {contact.username} is typing…
                        </span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </>
    );
}
