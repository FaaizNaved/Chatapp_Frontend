import { createRoot } from "react-dom/client";
import { useState } from "react";

const SERVER_URL = document.currentScript?.dataset?.server || window.location.origin;

function WidgetPanel({ onClose }) {
  return (
    <div id="chatsphere-widget-panel">
      <iframe
        src={`${SERVER_URL}/`}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="ChatSphere"
        allow="microphone"
      />
    </div>
  );
}

function Widget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        id="chatsphere-widget-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        title="ChatSphere"
      >
        {open ? "✕" : "💬"}
      </button>
      {open && <WidgetPanel onClose={() => setOpen(false)} />}
    </>
  );
}

// Self-mount when loaded as a widget script
const container = document.getElementById("widget-root") || (() => {
  const el = document.createElement("div");
  el.id = "chatsphere-widget-mount";
  document.body.appendChild(el);
  return el;
})();

createRoot(container).render(<Widget />);
