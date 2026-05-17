import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../../lib/context";
import {
  getThreadsForUser, getMessagesInThread, sendMessage, markThreadRead,
  getUnreadMessageCount, createThread, type Thread, type Message,
} from "../../../services/messaging-service";
import { MessageSquare, Send, ArrowLeft, Plus, Search, X, Paperclip, Phone, Video, MoreVertical } from "lucide-react";

interface NewConversationForm {
  recipientName: string;
  subject: string;
  message: string;
}

export function MessagesPanel() {
  const { user } = useAppContext();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newForm, setNewForm] = useState<NewConversationForm>({ recipientName: "", subject: "", message: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || "";

  useEffect(() => {
    setThreads(getThreadsForUser(userId));
  }, [userId]);

  useEffect(() => {
    if (selectedThread) {
      setMessages(getMessagesInThread(selectedThread));
      markThreadRead(selectedThread, userId);
      setThreads(getThreadsForUser(userId));
    }
  }, [selectedThread, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredThreads = threads.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.participantNames.some((n) => n.toLowerCase().includes(search.toLowerCase()))
  );

  const currentThread = threads.find((t) => t.id === selectedThread);

  const roleLabel =
    user?.role === "clo" ? "CLO" :
    user?.role === "dlo" ? "DLO" :
    user?.role === "student" ? "Student" :
    user?.role === "supervisor" ? "Industry Supervisor" :
    user?.role === "academic" ? "Academic Supervisor" : "HOD";

  const handleSend = () => {
    if (!messageText.trim() || !currentThread) return;
    const recipientId = currentThread.participantIds.find((id) => id !== userId) || "";
    const recipientName = currentThread.participantNames.find((_, i) => currentThread.participantIds[i] !== userId) || "";

    sendMessage(selectedThread!, userId, user?.name || "", roleLabel, recipientId, recipientName, messageText);
    setMessageText("");
    setMessages(getMessagesInThread(selectedThread!));
    setThreads(getThreadsForUser(userId));
  };

  const handleNewConversation = () => {
    if (!newForm.recipientName.trim() || !newForm.subject.trim() || !newForm.message.trim()) return;

    const recipientId = `u-${Date.now()}`;
    const result = createThread(
      [userId, recipientId],
      [user?.name || "", newForm.recipientName],
      newForm.subject,
      "",
      newForm.message,
      userId,
      user?.name || "",
      roleLabel,
      recipientId,
      newForm.recipientName
    );

    setShowNewConversation(false);
    setNewForm({ recipientName: "", subject: "", message: "" });
    setThreads(getThreadsForUser(userId));
    setSelectedThread(result.threadId);
  };

  const otherParticipant = (thread: Thread) => {
    const idx = thread.participantIds.indexOf(userId);
    return thread.participantNames[idx === 0 ? 1 : 0] || "Unknown";
  };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const onlineUsers = new Set(["Dr. Kwame Asante", "Kofi Mensah", "Mr. Mensah"]);

  const availableContacts = [
    { name: "Dr. Kwame Asante", role: "CLO" },
    { name: "Dr. Ama Serwaa", role: "DLO - Computer Science" },
    { name: "Prof. Yaw Boateng", role: "HOD - Computer Science" },
    { name: "Dr. Kweku Mensah", role: "Academic Supervisor" },
    { name: "Mr. Mensah", role: "Industry Supervisor" },
    { name: "Kofi Mensah", role: "Student" },
    { name: "Ama Owusu", role: "Student" },
  ].filter((c) => c.name !== user?.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          {threads.length} conversation{threads.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowNewConversation(true)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.8rem" }}
        >
          <Plus className="w-3.5 h-3.5" /> New Message
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ height: "calc(100vh - 310px)", minHeight: "400px" }}>
        {/* Thread List */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 ${selectedThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                  {search ? "No matching conversations" : "No conversations yet"}
                </p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2 mx-auto"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Plus className="w-4 h-4" /> Start One
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const other = otherParticipant(thread);
                const isOnline = onlineUsers.has(other);
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-accent transition-colors ${
                      selectedThread === thread.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ fontSize: "0.75rem" }}>
                          {getInitials(other)}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span style={{ fontSize: "0.85rem" }} className="text-foreground truncate">{other}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {thread.unreadCount > 0 && (
                              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center" style={{ fontSize: "0.6rem" }}>
                                {thread.unreadCount}
                              </span>
                            )}
                            <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
                              {new Date(thread.lastTimestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                        <p className="text-primary" style={{ fontSize: "0.75rem" }}>{thread.subject}</p>
                        <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.75rem" }}>{thread.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className={`flex-1 flex flex-col ${!selectedThread ? "hidden md:flex" : "flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3>Select a conversation</h3>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                  Choose a thread from the left to view messages.
                </p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2 mx-auto"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Plus className="w-4 h-4" /> New Conversation
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedThread(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ fontSize: "0.75rem" }}>
                      {currentThread ? getInitials(otherParticipant(currentThread)) : ""}
                    </div>
                    {currentThread && onlineUsers.has(otherParticipant(currentThread)) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: "0.9rem" }} className="text-foreground">
                        {currentThread ? otherParticipant(currentThread) : ""}
                      </p>
                      {currentThread && onlineUsers.has(otherParticipant(currentThread)) && (
                        <span className="text-emerald-600" style={{ fontSize: "0.7rem" }}>Online</span>
                      )}
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      {currentThread?.subject} {currentThread?.context ? `· ${currentThread.context}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Voice call"><Phone className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Video call"><Video className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="More"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mr-2 shrink-0 mt-auto" style={{ fontSize: "0.6rem" }}>
                          {getInitials(msg.senderName)}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        {!isMine && (
                          <p style={{ fontSize: "0.7rem" }} className="opacity-75 mb-1">{msg.senderName} · {msg.senderRole}</p>
                        )}
                        <p style={{ fontSize: "0.85rem" }}>{msg.content}</p>
                        <p style={{ fontSize: "0.65rem" }} className={`mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2 items-end">
                  <button className="p-2.5 rounded-lg border border-border hover:bg-accent text-muted-foreground shrink-0" title="Attach file">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shrink-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewConversation(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> New Conversation</h2>
              <button onClick={() => setShowNewConversation(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label style={{ fontSize: "0.8rem" }}>Recipient</label>
                <select
                  value={newForm.recipientName}
                  onChange={(e) => setNewForm({ ...newForm, recipientName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="">Select a contact...</option>
                  {availableContacts.map((c) => (
                    <option key={c.name} value={c.name}>{c.name} — {c.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Subject</label>
                <input type="text" value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} placeholder="e.g., Logbook Review Request" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Message</label>
                <textarea value={newForm.message} onChange={(e) => setNewForm({ ...newForm, message: e.target.value })} placeholder="Write your message..." className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]" style={{ fontSize: "0.85rem" }} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowNewConversation(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button
                onClick={handleNewConversation}
                disabled={!newForm.recipientName || !newForm.subject.trim() || !newForm.message.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}