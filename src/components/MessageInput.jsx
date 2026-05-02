import { useRef, useState, useCallback } from "react";

/* ── SVG icons ─────────────────────────────────────────────── */
const AttachIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);
const RemoveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) { value /= 1024; unitIndex++; }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function buildAttachmentPreview(file, source = "file") {
  const mime = file.type || "";
  let kind = "file";
  if (source === "voice" || mime.startsWith("audio/")) kind = "audio";
  else if (mime.startsWith("image/")) kind = "image";
  else if (mime.startsWith("video/")) kind = "video";
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file, kind, source, name: file.name, sizeLabel: formatFileSize(file.size),
    previewUrl: ["image","audio","video"].includes(kind) ? URL.createObjectURL(file) : null,
  };
}

export default function MessageInput({ onSend, onTyping, disabled, sending,
  placeholder = "Type a message…", readOnlyReason = "" }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const clearTypingState = useCallback(() => {
    if (isTypingRef.current) { onTyping(false); isTypingRef.current = false; }
    clearTimeout(typingTimeoutRef.current);
  }, [onTyping]);

  const releaseAttachment = useCallback((a) => { if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl); }, []);

  const handleSend = useCallback(async () => {
    if ((disabled || sending) || (!text.trim() && attachments.length === 0)) return;
    const sent = await onSend({ text: text.trim(), attachments: attachments.map(a => ({ file: a.file, kind: a.kind, source: a.source })) });
    if (!sent) return;
    attachments.forEach(releaseAttachment);
    setAttachments([]); setText(""); clearTypingState();
  }, [attachments, clearTypingState, disabled, onSend, releaseAttachment, sending, text]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }, [handleSend]);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
    if (!isTypingRef.current) { isTypingRef.current = true; onTyping(true); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; onTyping(false); }, 2000);
  }, [onTyping]);

  const handleInput = useCallback((e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  const addFiles = useCallback((fileList, source = "file") => {
    const next = Array.from(fileList || []).map(f => buildAttachmentPreview(f, source));
    if (next.length === 0) return;
    setAttachments(cur => [...cur, ...next]);
  }, []);

  const handleFileSelection = useCallback((e) => { addFiles(e.target.files, "file"); e.target.value = ""; }, [addFiles]);
  const handleRemoveAttachment = useCallback((id) => {
    setAttachments(cur => { const a = cur.find(i => i.id === id); releaseAttachment(a); return cur.filter(i => i.id !== id); });
  }, [releaseAttachment]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleToggleRecording = useCallback(async () => {
    if (disabled || sending) return;
    if (isRecording) { stopRecording(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("Voice recording is not supported in this browser."); return;
    }
    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = []; streamRef.current = stream; recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const ext = blob.type.includes("ogg") ? "ogg" : "webm";
        addFiles([new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type })], "voice");
        setIsRecording(false);
      };
      recorder.start(); setIsRecording(true);
    } catch (err) {
      console.error("voice recording error:", err); setRecordingError("Microphone access failed.");
    }
  }, [addFiles, disabled, isRecording, sending, stopRecording]);

  return (
    <div className="message-input-area">
      {attachments.length > 0 && (
        <div className="attachment-strip">
          {attachments.map(a => (
            <div key={a.id} className="attachment-chip">
              <div className="attachment-chip-body">
                <span className="attachment-chip-kind">{a.kind}</span>
                <span className="attachment-chip-name">{a.name}</span>
                <span className="attachment-chip-size">{a.sizeLabel}</span>
              </div>
              <button type="button" className="attachment-remove-btn" onClick={() => handleRemoveAttachment(a.id)}
                disabled={sending} aria-label={`Remove ${a.name}`}>
                <RemoveIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-row">
        <input ref={fileInputRef} type="file" className="hidden-file-input" multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileSelection} disabled={disabled || sending} />

        <button type="button" className="input-action-btn" onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending} title="Attach files">
          <AttachIcon />
        </button>

        <button type="button" className={`input-action-btn ${isRecording ? "recording" : ""}`}
          onClick={() => void handleToggleRecording()} disabled={disabled || sending}
          title={isRecording ? "Stop recording" : "Record voice note"}>
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>

        <textarea className="message-textarea" placeholder={placeholder} value={text}
          onChange={handleChange} onKeyDown={handleKeyDown} onInput={handleInput}
          disabled={disabled || sending} rows={1} />

        <button className="send-btn" onClick={() => void handleSend()}
          disabled={disabled || sending || (!text.trim() && attachments.length === 0)} title="Send">
          {sending ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" style={{animation:"spin 0.8s linear infinite"}}/>
            </svg>
          ) : <SendIcon />}
        </button>
      </div>

      {(recordingError || readOnlyReason || isRecording) && (
        <div className="input-hint">
          {recordingError || readOnlyReason || "🎙 Recording… tap stop when done."}
        </div>
      )}
    </div>
  );
}
