import { Component, useEffect, useState, useRef, useMemo, type ErrorInfo, type ReactNode } from "react";
import {
  fetchFullConversations,
  fetchConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  startLiveConversation,
  fetchLiveExhibitors,
  fetchLiveAttendees,
  type LiveConversation,
  type LiveChatMessage,
} from "@/lib/liveApi";
import { getSocket } from "@/lib/socket";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Button, Input, Modal, Textarea } from "@/components/ui";
import {
  Send,
  Search,
  Check,
  CheckCheck,
  Building2,
  MessageSquare,
  Shield,
  Plus,
  AlertTriangle,
  RefreshCw,
  Users,
  Mail,
  Lock,
} from "lucide-react";

// Safe Error Boundary to guarantee the screen never goes blank
class ChatErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ChatErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-900">Unable to display messages</h3>
          <p className="mx-auto max-w-md text-xs text-slate-500">
            A temporary display error occurred while rendering the messaging interface.
          </p>
          <Button size="sm" icon={<RefreshCw className="size-3.5" />} onClick={() => this.setState({ hasError: false })}>
            Retry Loading Chat
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface RealtimeChatViewProps {
  initialConversationId?: string;
  defaultFilter?: "ALL" | "DIRECT" | "SUPPORT" | "EXHIBITOR_COLLABORATION";
}

const FILTERS: { id: string; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "SUPPORT", label: "Support" },
  { id: "EXHIBITOR_COLLABORATION", label: "Exhibitors" },
];

const humanize = (s?: string) =>
  (s || "Direct").toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function RealtimeChatViewInner({ initialConversationId, defaultFilter = "ALL" }: RealtimeChatViewProps) {
  const { user, toast } = useStore();
  const [conversations, setConversations] = useState<LiveConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<string>(defaultFilter);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [newChatModal, setNewChatModal] = useState(false);

  // New Chat Form & Contact Picker
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [targetCategory, setTargetCategory] = useState<"SUPPORT" | "EXHIBITOR" | "ATTENDEE" | "CUSTOM">("SUPPORT");
  const [exhibitorList, setExhibitorList] = useState<any[]>([]);
  const [attendeeList, setAttendeeList] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState("");
  const [selectedAttendeeId, setSelectedAttendeeId] = useState("");

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const [exRes, atRes] = await Promise.allSettled([fetchLiveExhibitors(), fetchLiveAttendees()]);
      if (exRes.status === "fulfilled" && exRes.value?.exhibitors) {
        setExhibitorList(exRes.value.exhibitors);
        if (exRes.value.exhibitors.length > 0 && !selectedExhibitorId) {
          setSelectedExhibitorId(exRes.value.exhibitors[0].id || (exRes.value.exhibitors[0] as any)._id);
        }
      }
      if (atRes.status === "fulfilled" && Array.isArray(atRes.value)) {
        setAttendeeList(atRes.value);
        if (atRes.value.length > 0 && !selectedAttendeeId) {
          setSelectedAttendeeId(atRes.value[0].id || (atRes.value[0] as any)._id);
        }
      }
    } catch (e) {
      console.warn("Failed to load contacts:", e);
    } finally {
      setContactsLoading(false);
    }
  };

  const openNewChat = () => {
    setNewChatModal(true);
    loadContacts();
    if (user?.role === "attendee") {
      setTargetCategory("SUPPORT");
    } else if (user?.role === "exhibitor") {
      setTargetCategory("SUPPORT");
    } else {
      setTargetCategory("EXHIBITOR");
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to safely extract participant object
  const getParticipant = (c?: any) => {
    if (!c) return { _id: "", name: "Participant", email: "", role: "user" };
    if (c.display && (c.display.name || c.display.email)) {
      return {
        _id: c.display._id || c.display.id || "",
        name: c.display.name || "User",
        email: c.display.email || "",
        role: c.display.role || "user",
        avatar: c.display.avatar,
        companyName: c.display.company || c.display.companyName,
      };
    }
    const myId = String(user?.id || (user as any)?._id || "");
    const parts = Array.isArray(c.participants) ? c.participants : [];
    const other =
      parts.find((p: any) => {
        const pid = String(p?._id || p?.id || (typeof p === "string" ? p : ""));
        return pid && pid !== myId;
      }) || parts[0];

    if (!other) return { _id: "", name: "EventSphere Support", email: "support@eventsphere.io", role: "organizer" };
    if (typeof other === "string") return { _id: other, name: "User", email: "", role: "user" };
    return {
      _id: other._id || other.id || "",
      name: other.name || "User",
      email: other.email || "",
      role: other.role || "user",
      avatar: other.avatar,
      companyName: other.company || other.companyName,
    };
  };

  // Safe time formatting
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const convs = await fetchFullConversations();
      const safeConvs = Array.isArray(convs) ? convs : [];
      setConversations(safeConvs);
      if (!activeConvId && safeConvs.length > 0) {
        setActiveConvId(safeConvs[0]._id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c._id === activeConvId);
  }, [conversations, activeConvId]);

  // The other participant in the active conversation
  const otherParticipant = useMemo(() => {
    return getParticipant(activeConversation);
  }, [activeConversation, user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    fetchConversationMessages(activeConvId).then((msgs) => {
      setMessages(Array.isArray(msgs) ? msgs : []);
      markConversationAsRead(activeConvId).catch(() => {});
    });

    const socket = getSocket();
    if (socket) {
      socket.emit("conversation:join", activeConvId);
    }

    return () => {
      if (socket) {
        socket.emit("conversation:leave", activeConvId);
      }
    };
  }, [activeConvId]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingMessage = (data: any) => {
      const convId = data.conversationId || data.conversation?._id || data.conversation;
      const msg = data.message || data;

      if (convId === activeConvId && msg) {
        setMessages((prev) => {
          // If message with the same _id already exists, skip
          if (prev.some((m) => m._id && m._id === msg._id)) return prev;

          // If this message was sent by the current user, replace matching temporary optimistic message
          const myId = String(user?.id || (user as any)?._id || "");
          const sender = msg.sender || msg.senderId;
          const senderId = String(sender?._id || sender?.id || (typeof sender === "string" ? sender : ""));

          if (myId && senderId === myId) {
            const tempIdx = prev.findIndex(
              (m) => String(m._id).startsWith("temp-") && (m.content === msg.content || (m as any).body === msg.content)
            );
            if (tempIdx !== -1) {
              const copy = [...prev];
              copy[tempIdx] = msg;
              return copy;
            }
          }

          return [...prev, msg];
        });
        markConversationAsRead(activeConvId!).catch(() => {});
      }

      // Update conversations list preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === convId
            ? {
                ...c,
                lastMessage: msg?.content || msg?.body || c.lastMessage,
                lastMessageAt: msg?.createdAt || new Date().toISOString(),
                unreadCount: c._id === activeConvId ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
    };

    const handleMessageRead = (data: { conversationId: string; userId: string; readAt: string }) => {
      if (data.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) => {
            const currentReadBy = Array.isArray(m.readBy) ? m.readBy : [];
            return {
              ...m,
              readBy: [...currentReadBy, { userId: data.userId, readAt: data.readAt }],
            };
          })
        );
      }
    };

    const handleUserStatus = (data: { userId: string; status: "online" | "offline" }) => {
      if (data?.userId) {
        setOnlineUsers((prev) => ({
          ...prev,
          [data.userId]: data.status === "online",
        }));
      }
    };

    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data?.conversationId === activeConvId && data?.userId !== user?.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    };

    socket.on("message:new", handleIncomingMessage);
    socket.on("message:read", handleMessageRead);
    socket.on("user:status", handleUserStatus);
    socket.on("typing:update", handleTyping);

    return () => {
      socket.off("message:new", handleIncomingMessage);
      socket.off("message:read", handleMessageRead);
      socket.off("user:status", handleUserStatus);
      socket.off("typing:update", handleTyping);
    };
  }, [activeConvId, user]);

  // Handle typing notification
  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);

    // auto-grow the composer (max ~5 lines)
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

    const socket = getSocket();
    if (!socket || !activeConvId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", { conversationId: activeConvId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: activeConvId });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    const content = replyText.trim();
    setReplyText("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const socket = getSocket();
    if (socket && isTyping) {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: activeConvId });
    }

    // Optimistic message update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      _id: tempId,
      conversationId: activeConvId,
      sender: {
        _id: user?.id || "",
        name: user?.name || "You",
        email: user?.email || "",
        role: user?.role || "attendee",
      },
      messageType: "TEXT",
      content,
      body: content,
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const savedMsg = await sendChatMessage(activeConvId, content);
      setMessages((prev) => {
        // If socket already added the message, remove the temporary one
        if (prev.some((m) => m._id === (savedMsg as any)._id)) {
          return prev.filter((m) => m._id !== tempId);
        }
        return prev.map((m) => (m._id === tempId ? (savedMsg as any) : m));
      });
      // Do not emit socket message:send because sendChatMessage REST already persisted and broadcasted via socket
    } catch (err: any) {
      toast({
        title: "Send Failed",
        body: err.message || "Failed to deliver message.",
        tone: "danger",
      });
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  // Filter conversations safely
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const other = getParticipant(c);
      const hay = `${other?.name || ""} ${other?.email || ""} ${c.subject || ""} ${c.lastMessage || ""}`.toLowerCase();
      const matchesSearch = !searchQuery || hay.includes(searchQuery.toLowerCase());

      if (filterTab === "UNREAD") return matchesSearch && (c.unreadCount || 0) > 0;
      if (filterTab === "SUPPORT") return matchesSearch && c.conversationType === "SUPPORT";
      if (filterTab === "EXHIBITOR_COLLABORATION")
        return matchesSearch && c.conversationType === "EXHIBITOR_COLLABORATION";

      return matchesSearch;
    });
  }, [conversations, searchQuery, filterTab, user]);

  const otherOnline = !!(otherParticipant?._id && onlineUsers[otherParticipant._id]);
  const otherTyping = !!(otherParticipant?._id && typingUsers[otherParticipant._id]);

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:flex-row">
      {/* ======================= LEFT PANE: CONVERSATION LIST ======================= */}
      <aside className="flex max-h-60 w-full shrink-0 flex-col border-b border-slate-200 bg-white md:max-h-none md:w-72 md:border-b-0 md:border-r xl:w-80">
        <div className="space-y-3.5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-bold tracking-tight text-slate-900">Messages</h2>
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={openNewChat}>
              New chat
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations"
              aria-label="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterTab(f.id)}
                aria-pressed={filterTab === f.id}
                className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[12px] font-semibold transition ${
                  filterTab === f.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[13px] leading-relaxed text-slate-400">
              No conversations found.
              <br />
              Tap <span className="font-semibold text-slate-600">New chat</span> to reach out.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const other = getParticipant(c);
              const isSelected = c._id === activeConvId;
              const isOnline = other?._id ? !!onlineUsers[other._id] : false;
              const unread = c.unreadCount || 0;

              return (
                <button
                  key={c._id}
                  onClick={() => setActiveConvId(c._id)}
                  className={`flex w-full items-center gap-3 border-l-[3px] px-4 py-3.5 text-left transition ${
                    isSelected ? "border-brand-600 bg-brand-50/70" : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={other?.name || "User"} src={other?.avatar} size={42} />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className={`truncate text-[13.5px] text-slate-900 ${unread ? "font-bold" : "font-semibold"}`}>
                        {other?.name || "Member"}
                      </h4>
                      {c.lastMessageAt && (
                        <span className="shrink-0 text-[11px] text-slate-400">{formatTime(c.lastMessageAt)}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-[12.5px] ${unread ? "font-medium text-slate-700" : "text-slate-500"}`}>
                        {c.lastMessage || c.subject || "Open conversation"}
                      </p>
                      {unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ======================= CENTER PANE: REAL-TIME CHAT ======================= */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="relative shrink-0">
                <Avatar name={otherParticipant?.name || "User"} src={otherParticipant?.avatar} size={42} />
                {otherOnline && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-[15px] font-bold text-slate-900">{otherParticipant?.name}</h3>
                  <Badge tone="info" className="shrink-0 capitalize">
                    {otherParticipant?.role || "user"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-slate-500">
                  {otherTyping ? (
                    <span className="font-medium text-brand-600">typing…</span>
                  ) : otherOnline ? (
                    <span className="font-semibold text-emerald-600">Online</span>
                  ) : (
                    "Offline"
                  )}
                  {otherParticipant?.companyName && <span> · {otherParticipant.companyName}</span>}
                  {activeConversation.subject && <span> · {activeConversation.subject}</span>}
                </p>
              </div>
            </div>

            {/* Chat Bubbles */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
              {messages.length === 0 ? (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-200">
                      <MessageSquare className="size-5" />
                    </div>
                    <p className="mt-3 text-[13px] text-slate-500">No messages yet. Send the first one below.</p>
                  </div>
                </div>
              ) : (
                messages.map((m: any, idx: number) => {
                  const sender = m.sender || m.senderId;
                  const senderId = String(sender?._id || sender?.id || (typeof sender === "string" ? sender : "") || "");
                  const myId = String(user?.id || (user as any)?._id || "");
                  const isMine = Boolean(senderId && myId && senderId === myId);
                  const senderName =
                    (typeof sender === "object" ? sender?.name : null) || (isMine ? user?.name || "You" : "Participant");
                  const senderAvatar = typeof sender === "object" ? sender?.avatar : undefined;
                  const messageText = m.content || m.body || m.text || "";
                  const isRead = Array.isArray(m.readBy) && m.readBy.length > 0;

                  return (
                    <div key={m._id || idx} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && <Avatar name={senderName} src={senderAvatar} size={28} />}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] sm:max-w-[65%] ${
                          isMine
                            ? "rounded-br-md bg-brand-600 text-white shadow-md shadow-brand-600/20"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{messageText}</p>
                        <div
                          className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${
                            isMine ? "text-white/65" : "text-slate-400"
                          }`}
                        >
                          <span>{formatTime(m.createdAt)}</span>
                          {isMine &&
                            (isRead ? <CheckCheck className="size-3.5 text-sky-200" /> : <Check className="size-3.5" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherTyping && (
                <div className="flex items-end gap-2">
                  <Avatar name={otherParticipant.name} size={28} />
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-end gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pl-4 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
                <textarea
                  ref={inputRef}
                  rows={1}
                  aria-label="Write a message"
                  placeholder={`Message ${otherParticipant?.name || "participant"}…`}
                  value={replyText}
                  onChange={handleTypingChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="max-h-32 min-w-0 flex-1 resize-none self-center bg-transparent py-2 text-[13.5px] leading-snug text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  aria-label="Send message"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Send className="size-4.5" />
                </button>
              </div>
              <p className="mt-2 hidden px-1 text-[11px] text-slate-400 sm:block">
                Press Enter to send, Shift + Enter for a new line
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid size-16 place-items-center rounded-3xl bg-slate-50 text-slate-300 ring-1 ring-slate-200">
              <MessageSquare className="size-7" />
            </div>
            <p className="font-display text-[16px] font-bold text-slate-800">Select a conversation</p>
            <p className="max-w-xs text-[13px] text-slate-500">Choose a chat from the list, or start a new one.</p>
          </div>
        )}
      </section>

      {/* ======================= RIGHT PANE: CONTEXT SIDEBAR ======================= */}
      {activeConversation && otherParticipant && (
        <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white xl:flex">
          <div className="border-b border-slate-100 px-6 py-7 text-center">
            <Avatar
              name={otherParticipant.name || "User"}
              src={otherParticipant.avatar}
              size={72}
              className="mx-auto"
            />
            <h3 className="mt-3.5 font-display text-[16px] font-bold text-slate-900">{otherParticipant.name}</h3>
            {otherParticipant.email && (
              <p className="mt-0.5 break-all text-[12.5px] text-slate-500">{otherParticipant.email}</p>
            )}
            <Badge tone="info" className="mt-3 capitalize">
              {otherParticipant.role || "member"}
            </Badge>
          </div>

          <div className="px-6 py-5">
            <p className="text-[13px] font-bold text-slate-900">Conversation details</p>
            <dl className="mt-3 divide-y divide-slate-100 text-[12.5px]">
              {[
                ["Channel", humanize(activeConversation.conversationType)],
                otherParticipant.companyName ? ["Company", otherParticipant.companyName] : null,
                activeConversation.relatedExpoId
                  ? [
                      "Event",
                      typeof activeConversation.relatedExpoId === "object"
                        ? activeConversation.relatedExpoId.title
                        : "Registered event",
                    ]
                  : null,
                activeConversation.relatedBoothId
                  ? [
                      "Booth",
                      typeof activeConversation.relatedBoothId === "object"
                        ? activeConversation.relatedBoothId.boothNumber || activeConversation.relatedBoothId.boothId
                        : "Reserved",
                    ]
                  : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div key={(row as string[])[0]} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">{(row as string[])[0]}</dt>
                    <dd className="text-right font-medium text-slate-800">{(row as string[])[1]}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="mx-6 mb-6 mt-auto rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-slate-800">
              <Lock className="size-3.5 text-brand-600" /> Secure messaging
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
              Messages are stored securely and protected with authenticated access.
            </p>
          </div>
        </aside>
      )}

      {/* New Chat Modal */}
      {newChatModal && (
        <Modal open={newChatModal} onClose={() => setNewChatModal(false)} title="Start Conversation">
          <div className="space-y-4 pt-1">
            {/* Target Category Selector */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">Who would you like to message?</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { id: "SUPPORT", label: "Admin Desk", icon: Shield, color: "text-brand-600", subject: "Operations & Support Help" },
                    { id: "EXHIBITOR", label: "Exhibitors", icon: Building2, color: "text-indigo-600", subject: "Booth & Product Inquiry" },
                    { id: "ATTENDEE", label: "Attendees", icon: Users, color: "text-emerald-600", subject: "Event Networking" },
                    { id: "CUSTOM", label: "Custom Email", icon: Mail, color: "text-amber-600", subject: null },
                  ] as const
                ).map(({ id, label, icon: Icon, color, subject }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTargetCategory(id);
                      if (subject) setNewSubject(subject);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                      targetCategory === id
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`size-4 ${color}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Support Desk Info */}
            {targetCategory === "SUPPORT" && (
              <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">EventSphere Organizing & Support Desk</h4>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                    Direct line with the central event team for floor plan assistance, badge inquiries, payment confirmations, and on-site support.
                  </p>
                </div>
              </div>
            )}

            {/* Exhibitor Picker */}
            {targetCategory === "EXHIBITOR" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Select Exhibitor Company</label>
                {contactsLoading ? (
                  <p className="py-2 text-xs text-slate-400">Loading verified exhibitors...</p>
                ) : (
                  <select
                    value={selectedExhibitorId}
                    onChange={(e) => setSelectedExhibitorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">— Choose an Exhibitor —</option>
                    {exhibitorList.map((ex) => (
                      <option key={ex.id || ex._id} value={ex.id || ex._id}>
                        {ex.company} · {ex.category} (Booth {ex.booth || "TBD"})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Attendee Picker */}
            {targetCategory === "ATTENDEE" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Select Attendee</label>
                {contactsLoading ? (
                  <p className="py-2 text-xs text-slate-400">Loading attendee directory...</p>
                ) : (
                  <select
                    value={selectedAttendeeId}
                    onChange={(e) => setSelectedAttendeeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">— Choose an Attendee —</option>
                    {attendeeList.map((att) => (
                      <option key={att.id || att._id} value={att.id || att._id}>
                        {att.name} · {att.company} ({att.ticket || "Delegate"})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Custom Email */}
            {targetCategory === "CUSTOM" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Recipient Email or User ID</label>
                <Input
                  placeholder="e.g. attendee@eventsphere.com or user ID"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Subject</label>
              <Input
                placeholder="Subject of discussion..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Initial Message</label>
              <Textarea
                rows={3}
                placeholder="Type your message..."
                value={newInitialMsg}
                onChange={(e) => setNewInitialMsg(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
              <Button variant="outline" onClick={() => setNewChatModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  startingChat ||
                  (targetCategory === "EXHIBITOR" && !selectedExhibitorId) ||
                  (targetCategory === "ATTENDEE" && !selectedAttendeeId) ||
                  (targetCategory === "CUSTOM" && !newRecipientEmail)
                }
                onClick={async () => {
                  setStartingChat(true);
                  try {
                    let recipient = newRecipientEmail;
                    let convType: any = "DIRECT";
                    if (targetCategory === "SUPPORT") {
                      convType = "SUPPORT";
                      recipient = "admin@eventsphere.io";
                    } else if (targetCategory === "EXHIBITOR") {
                      recipient = selectedExhibitorId;
                      convType = user?.role === "exhibitor" ? "EXHIBITOR_COLLABORATION" : "DIRECT";
                    } else if (targetCategory === "ATTENDEE") {
                      recipient = selectedAttendeeId;
                      convType = "DIRECT";
                    }

                    const conv = await startLiveConversation({
                      recipientId: recipient,
                      conversationType: convType,
                      subject: newSubject || (targetCategory === "SUPPORT" ? "Support Inquiry" : "Discussion"),
                      initialMessage: newInitialMsg || "Hello! Looking forward to connecting.",
                    });
                    setNewChatModal(false);
                    await loadConversations();
                    if (conv?._id) setActiveConvId(conv._id);
                    toast({
                      title: "Conversation Started",
                      body: "You can now message each other in real-time.",
                      tone: "success",
                    });
                  } catch (err: any) {
                    toast({
                      title: "Error Starting Chat",
                      body: err.message || "Could not initialize conversation.",
                      tone: "danger",
                    });
                  } finally {
                    setStartingChat(false);
                  }
                }}
              >
                Start Chat
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function RealtimeChatView(props: RealtimeChatViewProps) {
  return (
    <ChatErrorBoundary>
      <RealtimeChatViewInner {...props} />
    </ChatErrorBoundary>
  );
}