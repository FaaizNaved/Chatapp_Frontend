import { useState } from "react";

function Avatar({ name, color, size = 42, fontSize = 17 }) {
    const initials = name
        ? name.slice(0, 2).toUpperCase()
        : "??";
    return (
        <div
            className="avatar-circle"
            style={{ width: size, height: size, background: color || "#7c3aed", fontSize }}
        >
            {initials}
        </div>
    );
}

export default function Sidebar({
    user, contacts, onlineUsers, selectedContact, onSelectContact, onLogout
}) {
    const [search, setSearch] = useState("");

    const filtered = contacts.filter(c =>
        c.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">💬</div>
                    <h2>ChatSphere</h2>
                </div>
                <button className="logout-btn" onClick={onLogout}>Sign Out</button>
            </div>

            {/* Current user */}
            <div className="sidebar-user">
                <div className="avatar">
                    <Avatar name={user.username} color={user.avatar_color} size={36} fontSize={14} />
                    <span className="avatar-badge online" />
                </div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{user.username}</div>
                    <div className="sidebar-user-status">● Online</div>
                </div>
            </div>

            {/* Search */}
            <div className="search-wrapper">
                <div className="search-input-wrapper">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="contacts-label">
                Contacts ({filtered.length})
            </div>

            {/* Contact list */}
            <div className="contacts-list">
                {filtered.length === 0 ? (
                    <div className="no-contacts">
                        {search ? `No contacts matching "${search}"` : "No other users yet"}
                    </div>
                ) : (
                    filtered.map(contact => {
                        const isOnline = onlineUsers.includes(String(contact.id));
                        const isSelected = selectedContact?.id === contact.id;
                        return (
                            <div
                                key={contact.id}
                                className={`contact-item ${isSelected ? "active" : ""}`}
                                onClick={() => onSelectContact(contact)}
                            >
                                <div className="avatar">
                                    <Avatar name={contact.username} color={contact.avatar_color} />
                                    <span className={`avatar-badge ${isOnline ? "online" : "offline"}`} />
                                </div>
                                <div className="contact-info">
                                    <div className="contact-name">{contact.username}</div>
                                    <div className="contact-preview">
                                        {isOnline ? "Active now" : "Offline"}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
