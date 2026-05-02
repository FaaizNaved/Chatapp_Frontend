import { useEffect, useMemo, useState, memo } from "react";
import UserAvatar from "./UserAvatar";

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:18,height:18}}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ICON_OPTIONS = {
  group: [
    { value: "group", label: "Team" },
    { value: "briefcase", label: "Work" },
    { value: "megaphone", label: "Updates" }
  ],
  discussion: [
    { value: "calendar", label: "Scheduled" },
    { value: "clock", label: "Timed" },
    { value: "lightning", label: "Quick" }
  ]
};

/* ── Custom Date-Time Picker ─────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n) { return String(n).padStart(2, "0"); }

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function futureDateObject(minutesAhead = 30) {
  return new Date(Date.now() + minutesAhead * 60 * 1000);
}

const CustomDateTimePicker = memo(function CustomDateTimePicker({ value, onChange }) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [year,   setYear]   = useState(value.getFullYear());
  const [month,  setMonth]  = useState(value.getMonth() + 1); // 1-12
  const [day,    setDay]    = useState(value.getDate());
  const [hour,   setHour]   = useState(value.getHours());
  const [minute, setMinute] = useState(Math.ceil(value.getMinutes() / 5) * 5 % 60);

  const years  = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear + i), [currentYear]);
  const days   = useMemo(() => Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1), [year, month]);
  const hours  = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], []);

  useEffect(() => {
    const maxDay = getDaysInMonth(year, month);
    const safeDay = Math.min(day, maxDay);
    if (safeDay !== day) setDay(safeDay);
    const newDate = new Date(year, month - 1, safeDay, hour, minute);
    onChange(newDate);
  }, [year, month, day, hour, minute, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = {
    background: "var(--bg-soft)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    padding: "8px 10px",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
    minWidth: 0,
    flex: 1,
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    paddingRight: "28px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Date row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select style={sel} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select style={sel} value={day} onChange={e => setDay(Number(e.target.value))}>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={sel} value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {/* Time row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select style={{...sel, flex: "0 0 auto", minWidth: 80}} value={hour} onChange={e => setHour(Number(e.target.value))}>
          {hours.map(h => <option key={h} value={h}>{pad(h)}:00</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>hr</span>
        <select style={{...sel, flex: "0 0 auto", minWidth: 80}} value={minute} onChange={e => setMinute(Number(e.target.value))}>
          {minutes.map(m => <option key={m} value={m}>{pad(m)} min</option>)}
        </select>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        📅 {MONTHS[month-1]} {day}, {year} at {pad(hour)}:{pad(minute)}
      </div>
    </div>
  );
});

export default memo(function ConversationComposer({
  open,
  type,
  contacts,
  creating,
  onClose,
  onCreate
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("group");
  const [memberIds, setMemberIds] = useState([]);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState("hours");
  const [scheduleMode, setScheduleMode] = useState("instant");
  const [scheduledDate, setScheduledDate] = useState(() => futureDateObject());
  const [error, setError] = useState("");

  const title = type === "discussion" ? "Create discussion" : "Create group";
  const helper = type === "discussion"
    ? "Create the discussion now or schedule it for later. Scheduled discussions send reminders automatically."
    : "Groups stay active until you decide otherwise.";
  const iconOptions = type === "discussion" ? ICON_OPTIONS.discussion : ICON_OPTIONS.group;

  const sortedContacts = useMemo(
    () => [...contacts].sort((left, right) => left.username.localeCompare(right.username)),
    [contacts]
  );

  useEffect(() => {
    if (!open) return;
    setName("");
    setIcon(type === "discussion" ? ICON_OPTIONS.discussion[0].value : ICON_OPTIONS.group[0].value);
    setMemberIds([]);
    setDurationValue(1);
    setDurationUnit("hours");
    setScheduleMode("instant");
    setScheduledDate(futureDateObject());
    setError("");
  }, [open, type]);

  if (!open) return null;

  function toggleMember(id) {
    setError("");
    setMemberIds((current) => (
      current.includes(String(id))
        ? current.filter((value) => value !== String(id))
        : [...current, String(id)]
    ));
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    const normalizedDuration = Number(durationValue);

    if (!trimmedName) {
      setError(`${type === "discussion" ? "Discussion" : "Group"} name is required.`);
      return;
    }

    if (memberIds.length === 0) {
      setError("Select at least one member.");
      return;
    }

    if (type === "discussion") {
      if (!Number.isFinite(normalizedDuration) || normalizedDuration < 1) {
        setError("Discussion duration must be at least 1.");
        return;
      }

      if (scheduleMode === "scheduled" && !scheduledDate) {
        setError("Choose when the discussion should start.");
        return;
      }

      if (scheduleMode === "scheduled" && scheduledDate < new Date()) {
        setError("Scheduled time must be in the future.");
        return;
      }
    }

    setError("");
    const payload = { name: trimmedName, icon, memberIds };
    if (type === "discussion") {
      payload.durationValue = normalizedDuration;
      payload.durationUnit = durationUnit;
      payload.scheduleMode = scheduleMode;
      if (scheduleMode === "scheduled") {
        payload.scheduled_for = scheduledDate.toISOString();
      }
    }

    const created = await onCreate(payload);
    if (!created) return;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card composer-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="section-kicker">{type === "discussion" ? "Timed room" : "Group chat"}</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close composer">
            <XIcon />
          </button>
        </div>

        <p className="composer-copy">{helper}</p>

        <label className="form-group">
          <span>Name</span>
          <input
            className="form-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={type === "discussion" ? "Weekend planning" : "Design team"}
          />
        </label>

        {type === "discussion" ? (
          <>
            <div className="form-group">
              <span>When to start</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={scheduleMode === "instant" ? "segment active" : "segment"}
                  onClick={() => setScheduleMode("instant")}
                >
                  Start now
                </button>
                <button
                  type="button"
                  className={scheduleMode === "scheduled" ? "segment active" : "segment"}
                  onClick={() => setScheduleMode("scheduled")}
                >
                  Schedule
                </button>
              </div>
            </div>

            {scheduleMode === "scheduled" ? (
              <div className="form-group">
                <span>Scheduled date & time</span>
                <CustomDateTimePicker value={scheduledDate} onChange={setScheduledDate} />
              </div>
            ) : null}

            <div className="form-group">
              <span>Duration</span>
              <div className="duration-composer-row">
                <input
                  className="form-input duration-number-input"
                  type="number"
                  min="1"
                  max="999"
                  value={durationValue}
                  onChange={(event) => setDurationValue(event.target.value)}
                />
                <div className="segmented-control" style={{ flex: 1 }}>
                  {["minutes","hours","days"].map(u => (
                    <button key={u} type="button"
                      className={durationUnit === u ? "segment active" : "segment"}
                      onClick={() => setDurationUnit(u)}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="form-group">
          <span>Members ({memberIds.length} selected)</span>
          <div className="member-picker">
            {sortedContacts.map((contact) => (
              <label
                key={contact.id}
                className={memberIds.includes(String(contact.id)) ? "member-option active" : "member-option"}
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(String(contact.id))}
                  onChange={() => toggleMember(contact.id)}
                />
                <UserAvatar
                  name={contact.username}
                  symbol={contact.avatar_symbol}
                  imageUrl={contact.avatar_url}
                  color={contact.avatar_color}
                  size={34}
                  fontSize={13}
                />
                <span>{contact.username}</span>
              </label>
            ))}
          </div>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            {creating ? "Creating..." : title}
          </button>
        </div>
      </div>
    </div>
  );
});
