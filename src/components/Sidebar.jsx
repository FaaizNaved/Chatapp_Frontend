import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import ConfirmDialog from "./ConfirmDialog";
import DualOptionDialog from "./DualOptionDialog";
import {
  MoreVertIcon,
  SettingsIcon,
  GroupAddIcon,
  CalendarIcon,
  PinIcon,
  LogoutIcon,
  SearchIcon,
} from "./icons";

/* ── LogoutIcon placeholder (add to icons.jsx if missing) ── */
const SignOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const PushPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────── */
function buildStatus(item, onlineUsers) {
  if (item.kind === "direct") {
    return onlineUsers.includes(String(item.id)) ? "Active now" : "Offline";
  }
  if (item.kind === "discussion") {
    if (item.status === "scheduled") return `Scheduled ${new Date(item.starts_at).toLocaleString()}`;
    return item.is_active ? `Ends ${new Date(item.ends_at).toLocaleString()}` : "Discussion ended";
  }
  return `${item.member_ids?.length || 0} members`;
}

/* ── Component ───────────────────────────────────────────── */
export default function Sidebar({
  user,
  items,
  onlineUsers,
  selectedItem,
  mobileVisible,
  onSelectItem,
  onTogglePin,
  onOpenSettings,
  onOpenGroup,
  onOpenDiscussion,
  onDeleteConversation,
  onLeaveGroup,
  onLogout,
}) {
  const [search,        setSearch]        = useState("");
  const [itemMenuKey,   setItemMenuKey]   = useState(null);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const menuRef     = useRef(null);
  const mainMenuRef = useRef(null);

  const filteredItems = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  /* Close item-level dropdown on outside click */
  const handleDocumentClick = useCallback((e) => {
    if (itemMenuKey && menuRef.current && !menuRef.current.contains(e.target)) {
      setItemMenuKey(null);
    }
    if (menuOpen && mainMenuRef.current && !mainMenuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  }, [itemMenuKey, menuOpen]);

  useEffect(() => {
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [handleDocumentClick]);

  const handleConfirmAction = useCallback((action) => {
    if (!confirmDialog) return;
    if (confirmDialog.type === "delete" && action === "confirm") {
      onDeleteConversation(confirmDialog.conversation);
    } else if (confirmDialog.type === "group") {
      if (action === "leave")  onLeaveGroup(confirmDialog.conversation);
      if (action === "delete") onDeleteConversation(confirmDialog.conversation);
    }
    setConfirmDialog(null);
  }, [confirmDialog, onDeleteConversation, onLeaveGroup]);

  const avatarInitials = (user.username || "").slice(0, 2).toUpperCase() || "??";

  return (
    <>
      <aside className={`sidebar${mobileVisible ? "" : " mobile-hidden"}`}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">💬</div>
            <div>
              <h2>ChatSphere</h2>
              <p>Chats · Groups · Discussions</p>
            </div>
          </div>

          {/* Main menu button */}
          <div className="header-actions" ref={mainMenuRef}>
            <button
              type="button"
              className="sidebar-icon-btn"
              aria-label="New group"
              title="New group"
              onClick={onOpenGroup}
              id="btn-new-group"
            >
              <GroupAddIcon />
            </button>
            <button
              type="button"
              className="sidebar-icon-btn"
              aria-label="New discussion"
              title="New discussion"
              onClick={onOpenDiscussion}
              id="btn-new-discussion"
            >
              <CalendarIcon />
            </button>
            <button
              type="button"
              className="sidebar-icon-btn"
              aria-label="Settings"
              title="Settings"
              onClick={onOpenSettings}
              id="btn-settings"
            >
              <SettingsIcon />
            </button>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="sidebar-icon-btn"
                aria-label="More options"
                title="More options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                id="btn-more-menu"
              >
                <MoreVertIcon />
              </button>

              {menuOpen && (
                <div className="menu-dropdown sidebar-main-dropdown">
                  <button type="button" onClick={() => { onOpenSettings(); setMenuOpen(false); }}>
                    <SettingsIcon /> Settings
                  </button>
                  <button type="button" onClick={() => { onOpenGroup(); setMenuOpen(false); }}>
                    <GroupAddIcon /> New Group
                  </button>
                  <button type="button" onClick={() => { onOpenDiscussion(); setMenuOpen(false); }}>
                    <CalendarIcon /> New Discussion
                  </button>
          <div className="menu-divider" />
                  <button
                    type="button"
                    onClick={() => { window.open("/about", "_blank"); setMenuOpen(false); }}
                  >
                    <InfoIcon /> About Product
                  </button>
                  <div className="menu-divider" />
                  <button
                    type="button"
                    className="menu-danger"
                    onClick={() => { onLogout(); setMenuOpen(false); }}
                    id="btn-logout"
                  >
                    <SignOutIcon /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── User info strip — click to open settings ─── */}
        <div
          className="sidebar-user"
          onClick={onOpenSettings}
          role="button"
          tabIndex={0}
          title="Open account settings"
          onKeyDown={(e) => e.key === "Enter" && onOpenSettings()}
          style={{ cursor: "pointer" }}
        >
          <UserAvatar
            name={user.username}
            symbol={user.avatar_symbol || avatarInitials}
            imageUrl={user.avatar_url}
            color={user.avatar_color}
            size={36}
            fontSize={14}
          />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.username || "Me"}</div>
            <div className="sidebar-user-status">● Online</div>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────────── */}
        <div className="sidebar-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search chats"
            id="chat-search"
          />
        </div>

        {/* ── Chat list ──────────────────────────────────── */}
        <div className="chat-list">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>No chats found</h3>
              <p>{search ? "Try different search terms" : "Start a conversation!"}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem && String(selectedItem.key) === String(item.key);
              const isMenuOpen = itemMenuKey === item.key;

              return (
                <div
                  key={item.key}
                  className={`contact-item${isSelected ? " active" : ""}`}
                  onClick={() => onSelectItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelectItem(item)}
                  id={`chat-item-${item.key}`}
                >
                  {/* Avatar + badge */}
                  <div className="contact-left">
                    <div style={{ position: "relative" }}>
                      <UserAvatar
                        name={item.title}
                        symbol={item.avatar_symbol}
                        imageUrl={item.avatar_url}
                        color={item.avatar_color}
                      />
                      {item.kind === "direct" && (
                        <span className={`avatar-badge ${onlineUsers.includes(String(item.id)) ? "online" : "offline"}`} />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="contact-info">
                    <div className="contact-line">
                      <span className="contact-name">{item.title}</span>
                      {item.pinned && (
                        <span className="pin-chip">
                          <PinIcon /> Pinned
                        </span>
                      )}
                      {item.kind !== "direct" && (
                        <span className={`type-pill ${item.kind}`}>{item.kind}</span>
                      )}
                    </div>
                    <div className="contact-preview">{buildStatus(item, onlineUsers)}</div>
                  </div>

                  {/* Kebab */}
                  <div
                    className="contact-right-actions"
                    ref={isMenuOpen ? menuRef : null}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="kebab-btn"
                      aria-label="Chat options"
                      aria-expanded={isMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemMenuKey((cur) => (cur === item.key ? null : item.key));
                      }}
                    >
                      <MoreVertIcon />
                    </button>

                    {isMenuOpen && (
                      <div className="item-menu-dropdown">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(item);
                            setItemMenuKey(null);
                          }}
                        >
                          <PushPinIcon />
                          {item.pinned ? "Unpin" : "Pin"}
                        </button>

                        {item.kind !== "direct" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({ type: "group", conversation: item });
                              setItemMenuKey(null);
                            }}
                          >
                            <TrashIcon />
                            Leave / Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="menu-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({ type: "delete", conversation: item });
                              setItemMenuKey(null);
                            }}
                          >
                            <TrashIcon />
                            Delete chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer logout ────────────────────────────────── */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={onLogout}
            id="btn-logout-footer"
            title="Sign out"
          >
            <SignOutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Confirmation dialogs */}
      {confirmDialog?.type === "group" && (
        <DualOptionDialog
          isOpen
          onClose={() => setConfirmDialog(null)}
          onLeave={() => { onLeaveGroup(confirmDialog.conversation); setConfirmDialog(null); }}
          onDelete={() => { onDeleteConversation(confirmDialog.conversation); setConfirmDialog(null); }}
          title="Group Options"
          message="What would you like to do with this group?"
        />
      )}
      {confirmDialog?.type === "delete" && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => { handleConfirmAction("confirm"); }}
          title="Delete Chat"
          message="Are you sure you want to delete this chat? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </>
  );
}
