import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MessageArea from "../components/MessageArea";
import MessageInput from "../components/MessageInput";
import { getSocket, disconnectSocket } from "../socket";

export default function ChatPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("chatapp_user") || "{}");
    const token = localStorage.getItem("chatapp_token");

    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingFrom, setTypingFrom] = useState(null);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const socketRef = useRef(null);
    const typingTimerRef = useRef(null);

    // ── Load contacts ─────────────────────────────────────────────
    const loadContacts = useCallback(async () => {
        try {
            const res = await fetch("/api/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setContacts(data.users);
        } catch (err) {
            console.error("load contacts:", err);
        }
    }, [token]);

    // ── Load messages ─────────────────────────────────────────────
    const loadMessages = useCallback(async (contact) => {
        if (!contact) return;
        setLoadingMsgs(true);
        try {
            const res = await fetch(
                `/api/chat/messages?user1=${user.id}&user2=${contact.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } catch (err) {
            console.error("load messages:", err);
        } finally {
            setLoadingMsgs(false);
        }
    }, [user.id, token]);

    // ── Socket setup ──────────────────────────────────────────────
    useEffect(() => {
        const socket = getSocket(token);
        socketRef.current = socket;

        socket.on("connect", () => console.log("✅ Socket connected"));
        socket.on("connect_error", (err) => {
            console.error("Socket error:", err.message);
            if (err.message.includes("Authentication")) {
                handleLogout();
            }
        });

        socket.on("onlineUsers", (ids) => {
            setOnlineUsers(ids.map(String));
        });

        socket.on("newMessage", (msg) => {
            setMessages(prev => {
                const exists = prev.some(m => m.id === msg.id);
                return exists ? prev : [...prev, msg];
            });
        });

        socket.on("messageSent", (msg) => {
            setMessages(prev => {
                const exists = prev.some(m => m.id === msg.id);
                return exists ? prev : [...prev, msg];
            });
        });

        socket.on("typing", ({ fromUserId, isTyping }) => {
            const fromStr = String(fromUserId);
            setTypingFrom(isTyping ? fromStr : null);
            if (isTyping) {
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => setTypingFrom(null), 3000);
            }
        });

        socket.on("messagesRead", () => {
            setMessages(prev => prev.map(m =>
                String(m.sender_id) === String(user.id) ? { ...m, is_read: true } : m
            ));
        });

        loadContacts();

        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("onlineUsers");
            socket.off("newMessage");
            socket.off("messageSent");
            socket.off("typing");
            socket.off("messagesRead");
        };
    }, [token, user.id]);

    // ── Select contact ────────────────────────────────────────────
    const handleSelectContact = useCallback((contact) => {
        setSelectedContact(contact);
        setTypingFrom(null);
        loadMessages(contact);

        // Mark messages as read
        if (socketRef.current) {
            socketRef.current.emit("markRead", { otherUserId: contact.id });
        }
    }, [loadMessages]);

    // ── Send message ──────────────────────────────────────────────
    const handleSendMessage = useCallback((text) => {
        if (!text.trim() || !selectedContact || !socketRef.current) return;
        socketRef.current.emit("sendMessage", {
            receiver_id: selectedContact.id,
            text: text.trim()
        });
    }, [selectedContact]);

    // ── Typing emit ───────────────────────────────────────────────
    const handleTyping = useCallback((isTyping) => {
        if (!selectedContact || !socketRef.current) return;
        socketRef.current.emit("typing", { toUserId: selectedContact.id, isTyping });
    }, [selectedContact]);

    // ── Logout ────────────────────────────────────────────────────
    function handleLogout() {
        disconnectSocket();
        localStorage.removeItem("chatapp_token");
        localStorage.removeItem("chatapp_user");
        navigate("/");
    }

    const isContactTyping = selectedContact &&
        String(typingFrom) === String(selectedContact.id);

    return (
        <div className="chat-layout">
            <Sidebar
                user={user}
                contacts={contacts}
                onlineUsers={onlineUsers}
                selectedContact={selectedContact}
                onSelectContact={handleSelectContact}
                onLogout={handleLogout}
            />
            <div className="message-area">
                <MessageArea
                    user={user}
                    contact={selectedContact}
                    messages={messages}
                    loading={loadingMsgs}
                    isOnline={selectedContact && onlineUsers.includes(String(selectedContact.id))}
                    isTyping={isContactTyping}
                />
                {selectedContact && (
                    <MessageInput
                        onSend={handleSendMessage}
                        onTyping={handleTyping}
                        disabled={!selectedContact}
                    />
                )}
            </div>
        </div>
    );
}
