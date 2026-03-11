import { useState, useRef, useCallback } from "react";

export default function MessageInput({ onSend, onTyping, disabled }) {
    const [text, setText] = useState("");
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const handleSend = useCallback(() => {
        if (!text.trim() || disabled) return;
        onSend(text.trim());
        setText("");
        // Stop typing
        if (isTypingRef.current) {
            onTyping(false);
            isTypingRef.current = false;
        }
        clearTimeout(typingTimeoutRef.current);
    }, [text, disabled, onSend, onTyping]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleChange = useCallback((e) => {
        setText(e.target.value);
        // Typing indicator
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTyping(true);
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onTyping(false);
        }, 2000);
    }, [onTyping]);

    // Auto-resize textarea
    const handleInput = useCallback((e) => {
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    }, []);

    return (
        <div className="message-input-area">
            <div className="input-row">
                <textarea
                    className="message-textarea"
                    placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    disabled={disabled}
                    rows={1}
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!text.trim() || disabled}
                    title="Send message"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m22 2-7 20-4-9-9-4z" />
                        <path d="M22 2 11 13" />
                    </svg>
                </button>
            </div>
            <div className="input-hint">Enter to send &mdash; Shift+Enter for new line</div>
        </div>
    );
}
