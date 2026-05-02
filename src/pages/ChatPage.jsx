import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MessageArea from "../components/MessageArea";
import MessageInput from "../components/MessageInput";
import SettingsModal from "../components/SettingsModal";
import ConversationComposer from "../components/ConversationComposer";
import { apiRequest, clearSession } from "../lib/authApi";
import { getSocket, disconnectSocket } from "../socket";
import { useToast } from "../components/ToastContext";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function applyTheme(settings) {
  const theme = settings?.theme || "default";
  document.documentElement.dataset.theme    = theme;
  document.documentElement.dataset.fontSize = settings?.font_size || "md";
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  if (settings?.liquid_glass) {
    document.body.dataset.liquidGlass = "true";
  } else {
    delete document.body.dataset.liquidGlass;
  }
}

function normalizeDirectItem(contact, pinnedItems) {
  return {
    key: `user:${contact.id}`,
    id: contact.id,
    kind: "direct",
    title: contact.username,
    avatar_color: contact.avatar_color,
    avatar_url: contact.avatar_url,
    avatar_symbol: contact.avatar_symbol,
    pinned: pinnedItems.includes(`user:${contact.id}`)
  };
}

function normalizeConversationItem(conversation, pinnedItems) {
  return {
    key: `conversation:${conversation.id}`,
    id: conversation.id,
    kind: conversation.type,
    title: conversation.name,
    avatar_color: conversation.type === "discussion" ? "#d97706" : "#2563eb",
    avatar_symbol: conversation.icon,
    avatar_url: "",
    member_ids: conversation.member_ids,
    starts_at: conversation.starts_at,
    ends_at: conversation.ends_at,
    status: conversation.status,
    is_active: conversation.is_active,
    pinned: pinnedItems.includes(`conversation:${conversation.id}`)
  };
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

function matchesSelection(message, selectedItem, currentUserId) {
  if (!selectedItem) return false;
  if (selectedItem.kind === "direct") {
    const senderId   = String(message.sender_id);
    const receiverId = String(message.receiver_id);
    return (
      [senderId, receiverId].includes(String(selectedItem.id)) &&
      [senderId, receiverId].includes(String(currentUserId))
    );
  }
  return String(message.conversation_id) === String(selectedItem.id);
}

export default function ChatPage() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [user,          setUser]          = useState(() => JSON.parse(localStorage.getItem("chatapp_user") || "{}"));
  const [contacts,      setContacts]      = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedKey,   setSelectedKey]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [typingFrom,    setTypingFrom]    = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage,  setSendingMessage]  = useState(false);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [composerType,    setComposerType]    = useState(null);
  const [savingSettings,  setSavingSettings]  = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [isMobile,            setIsMobile]            = useState(() => window.matchMedia("(max-width: 960px)").matches);
  const [mobileSidebarOpen,   setMobileSidebarOpen]   = useState(() => window.matchMedia("(max-width: 960px)").matches);

  const socketRef               = useRef(null);
  const typingTimerRef          = useRef(null);
  const selectedItemRef         = useRef(null);
  const userRef                 = useRef(user);
  const seenNotificationIdsRef  = useRef(new Set());

  const token = localStorage.getItem("chatapp_token");

  const pinnedItems = useMemo(() => user.pinned_items || [], [user.pinned_items]);

  const items = useMemo(() => sortItems([
    ...contacts.map((c)    => normalizeDirectItem(c, pinnedItems)),
    ...conversations.map((c) => normalizeConversationItem(c, pinnedItems))
  ]), [contacts, conversations, pinnedItems]);

  const selectedItem = useMemo(
    () => items.find((i) => i.key === selectedKey) || null,
    [items, selectedKey]
  );

  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  useEffect(() => { userRef.current = user; },               [user]);
  useEffect(() => { applyTheme(user.settings); },             [user.settings]);

  // Mobile breakpoint listener
  useEffect(() => {
    const media = window.matchMedia("(max-width: 960px)");
    const handle = (e) => {
      setIsMobile(e.matches);
      setMobileSidebarOpen(e.matches);
    };
    setIsMobile(media.matches);
    setMobileSidebarOpen(media.matches);
    media.addEventListener("change", handle);
    return () => media.removeEventListener("change", handle);
  }, []);

  // Apply theme from localStorage on first render
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("chatapp_user") || "{}");
    applyTheme(stored.settings);
  }, []);

  // Clean up liquid glass on unmount
  useEffect(() => () => { delete document.body.dataset.liquidGlass; }, []);

  /* ── API loaders ──────────────────────────────────────────── */
  const refreshCurrentUser = useCallback(async () => {
    const data = await apiRequest("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUser(data.user);
    localStorage.setItem("chatapp_user", JSON.stringify(data.user));
    return data.user;
  }, [token]);

  const loadContacts = useCallback(async () => {
    const data = await apiRequest("/api/users", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setContacts(data.users);
    return data.users;
  }, [token]);

  const loadConversations = useCallback(async () => {
    const data = await apiRequest("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setConversations(data.conversations || []);
    return data.conversations || [];
  }, [token]);

  const loadMessages = useCallback(async (item) => {
    if (!item) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const endpoint = item.kind === "direct"
        ? `/api/chat/messages?user1=${user.id}&user2=${item.id}`
        : `/api/conversations/${item.id}/messages`;
      const data = await apiRequest(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = (data.messages || []).sort((a, b) =>
        new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt)
      );
      setMessages(sorted);
      if (data.conversation) {
        setConversations((prev) => prev.map((c) =>
          String(c.id) === String(data.conversation.id) ? data.conversation : c
        ));
      }
    } catch (err) {
      console.error("load messages error:", err);
      toast.error(err.message || "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, [token, user.id, toast]);

  const loadNotifications = useCallback(async (isInitial = false) => {
    if (!token) return;
    try {
      const data = await apiRequest("/api/notifications?limit=50", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = data.notifications || [];
      const seen = seenNotificationIdsRef.current;
      notifications.forEach((n) => {
        const id = String(n.id);
        if (isInitial) { seen.add(id); return; }
        if (seen.has(id)) return;
        seen.add(id);
        if (
          document.hidden &&
          "Notification" in window &&
          userRef.current.settings?.notifications_enabled !== false
        ) {
          if (Notification.permission === "granted") {
            new Notification(n.title, { body: n.body });
          } else if (Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
          }
        }
      });
    } catch (err) {
      console.error("load notifications error:", err);
    }
  }, [token]);

  /* ── Auth ─────────────────────────────────────────────────── */
  const finishLogout = useCallback(() => {
    disconnectSocket();
    clearSession();
    navigate("/", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      finishLogout();
    }
  }, [finishLogout, token]);

  /* ── Socket setup ─────────────────────────────────────────── */
  useEffect(() => {
    if (!token) { navigate("/", { replace: true }); return undefined; }

    let mounted = true;
    const socket = getSocket(token);
    socketRef.current = socket;

    const handleConnectError = (err) => {
      if (!mounted) return;
      console.error("socket connect error:", err.message);
      if (err.message.includes("Authentication")) handleLogout();
    };

    const handleOnlineUsers = (ids) => {
      if (!mounted) return;
      setOnlineUsers(ids.map(String));
    };

    const handleConversationNew = (conversation) => {
      if (!mounted) return;
      setConversations((prev) => {
        const exists = prev.some((c) => String(c.id) === String(conversation.id));
        return exists
          ? prev.map((c) => String(c.id) === String(conversation.id) ? conversation : c)
          : [conversation, ...prev];
      });
    };

    const handleNewMessage = (message) => {
      if (!mounted) return;
      if (matchesSelection(message, selectedItemRef.current, userRef.current.id)) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      }
    };

    const handleMessageSent = (message) => {
      if (!mounted) return;
      if (matchesSelection(message, selectedItemRef.current, userRef.current.id)) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      }
      // Update conversation last-message info
      setConversations((prev) => prev.map((c) => {
        if (String(c.id) === String(message.conversation_id)) {
          return { ...c, message_count: (c.message_count || 0) + 1, last_message: message };
        }
        return c;
      }));
    };

    const handleTyping = ({ fromUserId, isTyping }) => {
      if (!mounted) return;
      setTypingFrom(isTyping ? String(fromUserId) : null);
      clearTimeout(typingTimerRef.current);
      if (isTyping) typingTimerRef.current = setTimeout(() => setTypingFrom(null), 2500);
    };

    const handleMessagesRead = () => {
      if (!mounted) return;
      setMessages((prev) => prev.map((m) =>
        String(m.sender_id) === String(userRef.current.id)
          ? { ...m, is_read: true }
          : m
      ));
    };

    const handleMessageError = ({ message }) => {
      if (!mounted) return;
      setSendingMessage(false);
      toast.error(message || "Failed to send message.");
    };

    socket.on("connect_error",      handleConnectError);
    socket.on("onlineUsers",        handleOnlineUsers);
    socket.on("conversation:new",   handleConversationNew);
    socket.on("newMessage",         handleNewMessage);
    socket.on("messageSent",        handleMessageSent);
    socket.on("typing",             handleTyping);
    socket.on("messagesRead",       handleMessagesRead);
    socket.on("messageError",       handleMessageError);

    // Load initial data
    Promise.all([
      refreshCurrentUser(),
      loadContacts(),
      loadConversations(),
      loadNotifications(true)
    ]).catch((err) => {
      if (mounted) {
        console.error("initial load error:", err);
        handleLogout();
      }
    });

    const intervalId = window.setInterval(() => {
      if (mounted) {
        loadNotifications(false).catch(() => {});
        loadConversations().catch(() => {});
      }
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      clearTimeout(typingTimerRef.current);
      socket.off("connect_error",    handleConnectError);
      socket.off("onlineUsers",      handleOnlineUsers);
      socket.off("conversation:new", handleConversationNew);
      socket.off("newMessage",       handleNewMessage);
      socket.off("messageSent",      handleMessageSent);
      socket.off("typing",           handleTyping);
      socket.off("messagesRead",     handleMessagesRead);
      socket.off("messageError",     handleMessageError);
    };
  }, [handleLogout, loadContacts, loadConversations, loadNotifications, navigate, refreshCurrentUser, toast, token, user.id]);

  // Auto-select first item
  useEffect(() => {
    if (!selectedKey && items.length > 0) setSelectedKey(items[0].key);
  }, [items, selectedKey]);

  // Load messages when selection changes
  useEffect(() => {
    if (selectedItem) {
      loadMessages(selectedItem);
      if (selectedItem.kind === "direct" && socketRef.current) {
        socketRef.current.emit("markRead", { otherUserId: selectedItem.id });
      }
    }
  }, [selectedItem?.id, selectedItem?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Attachment upload ───────────────────────────────────── */
  async function uploadAttachments(pendingAttachments) {
    const uploaded = [];
    for (const att of pendingAttachments) {
      const dataUrl = await fileToDataUrl(att.file);
      const data = await apiRequest("/api/chat/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileName: att.file.name,
          mimeType: att.file.type,
          dataUrl,
          mediaCategory: att.source
        })
      });
      uploaded.push(data.attachment);
    }
    return uploaded;
  }

  async function uploadProfilePicture(file) {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 2_500_000) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const maxSide = 512;
          const ratio   = Math.min(maxSide / img.width, maxSide / img.height, 1);
          const canvas  = document.createElement("canvas");
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }
    return dataUrl;
  }

  /* ── Message send ─────────────────────────────────────────── */
  async function handleSendMessage({ text, attachments }) {
    if (!selectedItem || (!text.trim() && attachments.length === 0) || !socketRef.current) return false;

    if (selectedItem.kind === "discussion" && selectedItem.status === "scheduled") {
      toast.info("This discussion has not started yet.");
      return false;
    }
    if (selectedItem.kind === "discussion" && !selectedItem.is_active) {
      toast.info("This discussion has already ended.");
      return false;
    }

    try {
      setSendingMessage(true);
      const uploadedAttachments = attachments.length ? await uploadAttachments(attachments) : [];
      socketRef.current.emit("sendMessage", {
        receiver_id:     selectedItem.kind === "direct" ? selectedItem.id : undefined,
        conversation_id: selectedItem.kind !== "direct" ? selectedItem.id : undefined,
        text:            text.trim(),
        attachments:     uploadedAttachments
      });
      return true;
    } catch (err) {
      console.error("send message error:", err);
      toast.error(err.message || "Failed to send message.");
      return false;
    } finally {
      setSendingMessage(false);
    }
  }

  function handleTypingEvent(isTyping) {
    if (!selectedItem || selectedItem.kind !== "direct" || !socketRef.current) return;
    socketRef.current.emit("typing", { toUserId: selectedItem.id, isTyping });
  }

  /* ── Settings ─────────────────────────────────────────────── */
  async function handleSaveSettings(form) {
    setSavingSettings(true);
    try {
      const avatarUrl = form.avatar_type === "image" && form.avatar_file
        ? await uploadProfilePicture(form.avatar_file)
        : form.avatar_type === "image"
          ? form.avatar_url
          : "";

      const [profile, settings] = await Promise.all([
        apiRequest("/api/users/me/profile", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            username:      form.username,
            avatar_symbol: form.avatar_type === "character"
              ? (form.username || "").slice(0, 2).toUpperCase() || "??"
              : "",
            avatar_type:  form.avatar_type,
            avatar_color: form.avatar_color,
            avatar_url:   avatarUrl,
          })
        }),
        apiRequest("/api/users/me/settings", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            theme:        form.theme,
            liquid_glass: Boolean(form.liquid_glass),
            font_size:    form.font_size,
            notifications_enabled:     Boolean(form.notifications_enabled),
            notification_preferences:  form.notification_preferences,
          })
        })
      ]);

      const merged = { ...profile.user, settings: settings.user.settings };
      setUser(merged);
      applyTheme(merged.settings);
      localStorage.setItem("chatapp_user", JSON.stringify(merged));
      setContacts((prev) => prev.map((c) =>
        String(c.id) === String(merged.id)
          ? { ...c, username: merged.username, avatar_symbol: merged.avatar_symbol,
              avatar_url: merged.avatar_url, avatar_color: merged.avatar_color }
          : c
      ));
      setSettingsOpen(false);
    } catch (err) {
      throw err; // bubble to SettingsModal for inline display
    } finally {
      setSavingSettings(false);
    }
  }

  /* ── Pin ──────────────────────────────────────────────────── */
  async function handleTogglePin(item) {
    try {
      if (!item) throw new Error("Missing chat item");
      let itemKey = item.key || "";
      if (!itemKey) {
        const prefix = item.kind === "direct" ? "user" : "conversation";
        itemKey = `${prefix}:${item.id}`;
      }
      const data = await apiRequest("/api/users/me/pins/toggle", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemKey })
      });
      const updated = { ...user, pinned_items: data.pinned_items };
      setUser(updated);
      localStorage.setItem("chatapp_user", JSON.stringify(updated));
    } catch (err) {
      console.error("handleTogglePin error:", err);
      toast.error(err.message || "Failed to update pin.");
    }
  }

  /* ── Delete / Leave ───────────────────────────────────────── */
  const handleDeleteConversation = async (conversation) => {
    try {
      await apiRequest(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations((prev) => prev.filter((c) => String(c.id) !== String(conversation.id)));
      // Fix: use setSelectedKey, not setSelectedItem
      if (selectedItem && String(selectedItem.id) === String(conversation.id)) {
        setSelectedKey(null);
        setMessages([]);
      }
      toast.success("Conversation deleted.");
    } catch (err) {
      console.error("Delete conversation error:", err);
      toast.error(err.message || "Failed to delete conversation.");
    }
  };

  const handleLeaveGroup = async (conversation) => {
    try {
      await apiRequest(`/api/conversations/${conversation.id}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations((prev) => prev.filter((c) => String(c.id) !== String(conversation.id)));
      // Fix: use setSelectedKey, not setSelectedItem
      if (selectedItem && String(selectedItem.id) === String(conversation.id)) {
        setSelectedKey(null);
        setMessages([]);
      }
      toast.success("Left the group.");
    } catch (err) {
      console.error("Leave conversation error:", err);
      toast.error(err.message || "Failed to leave the group.");
    }
  };

  /* ── Create conversation ─────────────────────────────────── */
  async function handleCreateConversation(payload) {
    if (!composerType) return false;
    setCreatingConversation(true);
    try {
      const data = await apiRequest(`/api/conversations/${composerType}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const newConv = data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setSelectedKey(`conversation:${newConv.id}`);
      if (socketRef.current?.connected) {
        socketRef.current.emit("joinConversation", { conversationId: newConv.id });
      }
      setComposerType(null);
      toast.success(`${composerType === "group" ? "Group" : "Discussion"} created!`);
      return true;
    } catch (err) {
      console.error("handleCreateConversation error:", err);
      toast.error(err.message || "Failed to create conversation.");
      return false;
    } finally {
      setCreatingConversation(false);
    }
  }

  const isContactTyping = selectedItem?.kind === "direct" && String(typingFrom) === String(selectedItem.id);

  return (
    <div className="chat-layout">
      <Sidebar
        user={user}
        items={items}
        onlineUsers={onlineUsers}
        selectedItem={selectedItem}
        mobileVisible={!isMobile || mobileSidebarOpen}
        onSelectItem={(item) => {
          setSelectedKey(item.key);
          if (isMobile) setMobileSidebarOpen(false);
        }}
        onTogglePin={handleTogglePin}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenGroup={() => setComposerType("group")}
        onOpenDiscussion={() => setComposerType("discussion")}
        onDeleteConversation={handleDeleteConversation}
        onLeaveGroup={handleLeaveGroup}
        onLogout={handleLogout}
      />

      <div className={isMobile && mobileSidebarOpen ? "message-panel mobile-hidden" : "message-panel"}>
        <MessageArea
          user={user}
          selectedItem={selectedItem}
          messages={messages}
          loading={loadingMessages}
          isOnline={selectedItem?.kind === "direct" && onlineUsers.includes(String(selectedItem.id))}
          isTyping={isContactTyping}
          onTogglePin={handleTogglePin}
          onOpenSettings={() => setSettingsOpen(true)}
          onBackToSidebar={() => setMobileSidebarOpen(true)}
          showBackButton={isMobile}
        />

        {selectedItem ? (
          <MessageInput
            key={selectedItem.key}
            onSend={handleSendMessage}
            onTyping={handleTypingEvent}
            disabled={
              (selectedItem.kind === "discussion" && !selectedItem.is_active) ||
              (selectedItem.kind === "discussion" && selectedItem.status === "scheduled")
            }
            sending={sendingMessage}
            placeholder={
              selectedItem.kind === "discussion"
                ? selectedItem.status === "scheduled"
                  ? `Discussion starts ${new Date(selectedItem.starts_at).toLocaleString()}`
                  : "Share updates before the discussion timer runs out"
                : `Message ${selectedItem.title}`
            }
            readOnlyReason={
              selectedItem.kind === "discussion" && selectedItem.status === "scheduled"
                ? "This discussion is scheduled and has not started yet."
                : selectedItem.kind === "discussion" && !selectedItem.is_active
                  ? "This discussion is closed."
                  : ""
            }
          />
        ) : null}
      </div>

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          user={user}
          saving={savingSettings}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          onUserUpdated={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("chatapp_user", JSON.stringify(updatedUser));
          }}
        />
      )}

      <ConversationComposer
        open={!!composerType}
        type={composerType}
        contacts={contacts}
        creating={creatingConversation}
        onClose={() => setComposerType(null)}
        onCreate={handleCreateConversation}
      />
    </div>
  );
}
