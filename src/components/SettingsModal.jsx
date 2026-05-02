import { useEffect, useRef, useState, memo } from "react";
import UserAvatar from "./UserAvatar";

/* ── Token colours ─────────────────────────────────────────── */
const PRESET_COLORS = [
  "#14b8a6","#6366f1","#f59e0b","#ef4444","#8b5cf6",
  "#10b981","#3b82f6","#ec4899","#f97316","#06b6d4",
];

/* ── Helpers ────────────────────────────────────────────────── */
function initials(name = "") {
  const letters = (name || "").replace(/[^A-Za-z0-9]/g, "");
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (letters.length === 1) return (letters + letters).toUpperCase();
  return "??";
}

function fromUser(user) {
  const name = user?.username || "";
  return {
    username:  name,
    avatar_symbol: initials(name),
    avatar_type:   user?.avatar_type  || (user?.avatar_url ? "image" : "character"),
    avatar_url:    user?.avatar_url   || "",
    avatar_file:   null,
    avatar_color:  user?.avatar_color || PRESET_COLORS[0],
    theme:         user?.settings?.theme          || "default",
    font_size:     user?.settings?.font_size       || "md",
    notifications_enabled:        user?.settings?.notifications_enabled !== false,
    notification_preferences: {
      direct_messages:    user?.settings?.notification_preferences?.direct_messages    !== false,
      group_messages:     user?.settings?.notification_preferences?.group_messages     !== false,
      discussion_updates: user?.settings?.notification_preferences?.discussion_updates !== false,
    },
  };
}

/* Live-apply theme to document without saving */
function applyPreview(theme, fontSize) {
  document.documentElement.dataset.theme     = theme;
  document.documentElement.dataset.fontSize  = fontSize || "md";
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

/* ── Toggle ─────────────────────────────────────────────────── */
function Toggle({ id, checked, onChange, label }) {
  return (
    <label className="toggle-row" htmlFor={id} style={{ cursor: "pointer" }}>
      <span style={{ flex: 1, fontSize: "0.9rem", color: "var(--text-primary)" }}>{label}</span>
      <span className="toggle-switch">
        <input id={id} type="checkbox" style={{ display: "none" }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`toggle-slider${checked ? " on" : ""}`} />
      </span>
    </label>
  );
}

/* ── Segmented control ──────────────────────────────────────── */
function Segment({ options, value, onChange }) {
  return (
    <div className="segmented-control">
      {options.map(([v, label]) => (
        <button key={v} type="button"
          className={`segment${value === v ? " active" : ""}`}
          onClick={() => onChange(v)}
        >{label}</button>
      ))}
    </div>
  );
}

/* ── SVG icons ──────────────────────────────────────────────── */
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const UserIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PaintIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="13" cy="13" r="3"/><path d="M2 2l6 6"/><path d="M20 4 8 16"/><path d="M14 2l8 8-4 4"/></svg>;
const BellIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

/* ── ContactVerifyRow ───────────────────────────────────────── */
function ContactVerifyRow({ field, icon, label, currentUser, onVerified }) {
  const value     = field === "email" ? currentUser?.email     : currentUser?.phone;
  const verified  = field === "email" ? currentUser?.email_verified : currentUser?.phone_verified;
  const [mode,    setMode]    = useState("idle");   // idle | adding | otp | loading | done | error
  const [input,   setInput]   = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [msg,     setMsg]     = useState("");

  const token = () => localStorage.getItem("chatapp_token") || "";

  const sendOtp = async (val) => {
    setMode("loading"); setMsg("");
    try {
      const res = await fetch("/api/verify/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ field, value: val || input }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMode("otp"); setMsg(data.message || "Code sent!");
    } catch (e) { setMode("adding"); setMsg(e.message || "Failed to send code."); }
  };

  const confirmOtp = async () => {
    setMode("loading"); setMsg("");
    try {
      const res = await fetch("/api/verify/confirm-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ field, code: otpCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMode("done"); setMsg(data.message);
      if (onVerified && data.user) onVerified(data.user);
    } catch (e) { setMode("otp"); setMsg(e.message || "Incorrect code."); }
  };

  if (verified) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        borderRadius:"var(--radius-sm)", background:"var(--bg-soft)", border:"1px solid var(--border)" }}>
        <span>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", color:"var(--text-muted)" }}>{label}</div>
          <div style={{ fontSize:"0.9rem", color:"var(--text-primary)" }}>{value}</div>
        </div>
        <span style={{ fontSize:"0.72rem", color:"#6ee7b7", background:"rgba(52,211,153,0.12)",
          padding:"3px 10px", borderRadius:999, fontWeight:700, whiteSpace:"nowrap" }}>✓ Verified</span>
      </div>
    );
  }

  return (
    <div style={{ borderRadius:"var(--radius-sm)", background:"var(--bg-soft)", border:"1px solid var(--border)", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
        <span>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", color:"var(--text-muted)" }}>{label}</div>
          <div style={{ fontSize:"0.9rem", color:value ? "var(--text-primary)" : "var(--text-muted)", fontStyle:value ? "normal" : "italic" }}>
            {value || "Not provided"}
          </div>
        </div>
        {mode === "idle" && (
          <button type="button" onClick={() => { setInput(value || ""); setMode("adding"); setMsg(""); }}
            style={{ fontSize:"0.78rem", fontWeight:700, padding:"4px 12px", borderRadius:20,
              background:"var(--accent-soft,rgba(20,184,166,0.12))", color:"var(--accent-strong)",
              border:"1px solid var(--accent,#14b8a6)", cursor:"pointer", whiteSpace:"nowrap" }}>
            {value ? "Verify" : "Add"}
          </button>
        )}
        {mode === "loading" && <span style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>…</span>}
        {(mode === "adding" || mode === "otp") && (
          <button type="button" onClick={() => { setMode("idle"); setMsg(""); setOtpCode(""); }}
            style={{ fontSize:"1rem", background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }}>✕</button>
        )}
      </div>

      {mode === "adding" && (
        <div style={{ padding:"0 14px 12px", display:"flex", gap:8 }}>
          <input type={field === "email" ? "email" : "tel"}
            placeholder={field === "email" ? "Enter email address" : "Enter phone number"}
            value={input} onChange={e => setInput(e.target.value)}
            style={{ flex:1, padding:"8px 12px", borderRadius:8, fontSize:"0.88rem",
              background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-primary)", outline:"none" }}
          />
          <button type="button" onClick={() => sendOtp(input)} disabled={!input.trim()}
            style={{ padding:"8px 14px", borderRadius:8, background:"var(--accent,#14b8a6)",
              color:"white", fontWeight:700, fontSize:"0.82rem", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
            Send Code
          </button>
        </div>
      )}

      {mode === "otp" && (
        <div style={{ padding:"0 14px 12px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Enter the 6-digit code:</div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="123456"
              value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,""))}
              style={{ flex:1, padding:"8px 12px", borderRadius:8, fontSize:"1.1rem", fontWeight:700,
                letterSpacing:"0.3em", textAlign:"center",
                background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-primary)", outline:"none" }}
            />
            <button type="button" onClick={confirmOtp} disabled={otpCode.length < 6}
              style={{ padding:"8px 14px", borderRadius:8, background:"var(--accent,#14b8a6)",
                color:"white", fontWeight:700, fontSize:"0.82rem", border:"none", cursor:"pointer" }}>
              Confirm
            </button>
          </div>
          <button type="button" onClick={() => sendOtp(input)}
            style={{ background:"none", border:"none", color:"var(--accent-strong)", fontSize:"0.78rem",
              cursor:"pointer", textAlign:"left", padding:0 }}>Resend code</button>
        </div>
      )}

      {mode === "done" && (
        <div style={{ padding:"0 14px 12px", fontSize:"0.82rem", color:"#6ee7b7" }}>✓ {msg}</div>
      )}

      {msg && mode !== "done" && mode !== "idle" && (
        <div style={{ padding:"0 14px 10px", fontSize:"0.78rem",
          color: msg.includes("sent") || msg.includes("Code:") ? "var(--accent-strong)" : "#fca5a5" }}>{msg}</div>
      )}
    </div>
  );
}

const THEME_OPTIONS = [
  { value: "default", emoji: "🌊", label: "Teal", desc: "Deep indigo + teal" },
  { value: "light",   emoji: "☀️", label: "Light", desc: "Clean & bright" },
  { value: "dark",    emoji: "🌌", label: "Dark",  desc: "True dark mode" },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default memo(function SettingsModal({ open, user, saving, onClose, onSave, onUserUpdated }) {
  const [form,      setForm]      = useState(() => fromUser(user));
  const [tab,       setTab]       = useState("profile");
  const [localSave, setLocalSave] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk,    setSaveOk]    = useState(false);
  const fileRef = useRef(null);
  const origTheme    = useRef(user?.settings?.theme    || "default");
  const origFontSize = useRef(user?.settings?.font_size || "md");

  /* Reset on open */
  useEffect(() => {
    if (!open) return;
    const f = fromUser(user);
    setForm(f);
    setTab("profile");
    setSaveError("");
    setSaveOk(false);
    origTheme.current    = user?.settings?.theme    || "default";
    origFontSize.current = user?.settings?.font_size || "md";
  }, [open, user]);

  /* Restore theme on close-without-save */
  const handleClose = () => {
    applyPreview(origTheme.current, origFontSize.current);
    onClose();
  };

  /* Save */
  const handleSave = async () => {
    setSaveError("");
    setSaveOk(false);
    setLocalSave(true);
    try {
      await onSave(form);
      setSaveOk(true);
      origTheme.current    = form.theme;
      origFontSize.current = form.font_size;
      setTimeout(() => setSaveOk(false), 2000);
    } catch (err) {
      setSaveError(err?.message || "Save failed. Try again.");
    } finally {
      setLocalSave(false);
    }
  };

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const changeTheme = (theme) => {
    setForm(prev => ({ ...prev, theme }));
    applyPreview(theme, form.font_size);
  };

  const changeFontSize = (font_size) => {
    setForm(prev => ({ ...prev, font_size }));
    applyPreview(form.theme, font_size);
  };

  if (!open) return null;

  const tabs = [
    { id: "profile",       label: "Profile",      Icon: UserIcon  },
    { id: "appearance",    label: "Appearance",   Icon: PaintIcon },
    { id: "notifications", label: "Notifications",Icon: BellIcon  },
  ];

  const isSaving = saving || localSave;
  const avatarInitials = initials(form.username);

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card settings-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="modal-header">
          <div>
            <p className="section-kicker">Preferences</p>
            <h3>Settings</h3>
          </div>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        {/* ── Avatar preview strip ───────────────────────────── */}
        <div className="settings-preview">
          <UserAvatar
            name={form.username}
            symbol={form.avatar_type === "character" ? avatarInitials : form.avatar_symbol}
            imageUrl={form.avatar_type === "image" ? form.avatar_url : ""}
            color={form.avatar_color}
            size={52} fontSize={21}
          />
          <div style={{ marginLeft: 12 }}>
            <div className="settings-preview-title">{form.username || "Your name"}</div>
            <div className="settings-preview-subtitle">
              <span style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "monospace", fontSize: "1.05em" }}>
                {avatarInitials}
              </span>
              {" · "}
              <span style={{ color: "var(--text-muted)" }}>Theme: </span>
              <strong style={{ color: "var(--accent)" }}>{form.theme}</strong>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="settings-tabs">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              className={`settings-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="settings-body">
            <div className="settings-field">
              <label className="settings-label">Username</label>
              <input className="form-input" value={form.username}
                onChange={e => {
                  const username = e.target.value;
                  setForm(prev => ({
                    ...prev, username,
                    avatar_symbol: prev.avatar_type === "character"
                      ? initials(username)
                      : prev.avatar_symbol,
                  }));
                }}
                placeholder="Your username"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Avatar type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className={`segment${form.avatar_type === "character" ? " active" : ""}`} style={{ flex: 1 }}
                  onClick={() => setForm(prev => ({ ...prev, avatar_type: "character", avatar_symbol: initials(prev.username), avatar_url: "" }))}>
                  Initials
                </button>
                <button type="button" className={`segment${form.avatar_type === "image" ? " active" : ""}`} style={{ flex: 1 }}
                  onClick={() => fileRef.current?.click()}>
                  Upload
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setForm(prev => ({ ...prev, avatar_type: "image", avatar_url: URL.createObjectURL(file), avatar_file: file }));
                  }}
                />
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Accent color</label>
              <div className="color-choice-row">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" className={`color-choice${form.avatar_color === c ? " active" : ""}`} style={{ background: c }}
                    onClick={() => set("avatar_color")(c)} title={c} />
                ))}
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Contact Info</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <ContactVerifyRow field="email" icon="✉️" label="Email" currentUser={user} onVerified={onUserUpdated} />
                <ContactVerifyRow field="phone" icon="📱" label="Phone" currentUser={user} onVerified={onUserUpdated} />
              </div>
            </div>
          </div>
        )}

        {/* ══ APPEARANCE TAB ════════════════════════════════════ */}
        {tab === "appearance" && (
          <div className="settings-body">
            <div className="settings-field">
              <label className="settings-label">Theme (live preview)</label>
              <div className="theme-choice-grid">
                {THEME_OPTIONS.map(({ value, emoji, label, desc }) => (
                  <button key={value} type="button"
                    onClick={() => changeTheme(value)}
                    className={`theme-card${form.theme === value ? " active" : ""}`}
                  >
                    <div className="theme-card-emoji">{emoji}</div>
                    <div className="theme-card-name">{label}</div>
                    <div className="theme-card-desc">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Font size</label>
              <Segment
                options={[["sm","Small"],["md","Medium"],["lg","Large"]]}
                value={form.font_size}
                onChange={changeFontSize}
              />
            </div>

          </div>
        )}

        {/* ══ NOTIFICATIONS TAB ══════════════════════════════ */}
        {tab === "notifications" && (
          <div className="settings-body">
            <Toggle id="notif_all"
              label="Enable notifications"
              checked={form.notifications_enabled}
              onChange={(val) => set("notifications_enabled")(val)}
            />
            {["direct_messages","group_messages","discussion_updates"].map(key => {
              const labels = { direct_messages:"Direct messages", group_messages:"Group messages", discussion_updates:"Discussion updates" };
              return (
                <Toggle key={key} id={`notif_${key}`}
                  label={labels[key]}
                  checked={form.notification_preferences[key]}
                  onChange={(val) => setForm(prev => ({
                    ...prev,
                    notification_preferences: {
                      ...prev.notification_preferences,
                      [key]: val,
                    }
                  }))}
                />
              );
            })}
          </div>
        )}

        {/* ── Error / Success feedback ───────────────────────── */}
        {saveError && (
          <div style={{ padding: "10px 16px", background: "rgba(248,113,113,0.12)",
            borderRadius: "var(--radius-sm)", color: "#fca5a5", fontSize: "0.88rem", margin: "0 0 8px" }}>
            ⚠️ {saveError}
          </div>
        )}
        {saveOk && (
          <div style={{ padding: "10px 16px", background: "rgba(52,211,153,0.12)",
            borderRadius: "var(--radius-sm)", color: "#6ee7b7", fontSize: "0.88rem", margin: "0 0 8px" }}>
            ✓ Settings saved successfully!
          </div>
        )}

        {/* ── Footer buttons ─────────────────────────────────── */}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
});
