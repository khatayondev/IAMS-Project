import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../lib/context";
import { useSupervisorDataAccess } from "../../hooks/use-supervisor-data-access";
import { apiClient } from "../../lib/api-client";
import {
  Send, Loader2, MessageSquare, Search, ChevronLeft, Plus,
  AlertCircle, Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { MessageThread, Message } from "../../types/api";

export function SupervisorMessagesPage() {
  const { user } = useAppContext();
  const { filterByAssignedStudents, canAccessStudent } = useSupervisorDataAccess();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async () => {
    try {
      const res = await apiClient.getThreads();
      if (res.success && Array.isArray(res.data)) {
        // SECURITY: Filter threads to only show conversations with assigned students
        const filtered = res.data.filter((thread: any) => {
          // Check if any participant (other than supervisor) is an assigned student
          return thread.participants?.some((p: any) =>
            p.role === "student" && canAccessStudent(p.id)
          );
        });
        setThreads(filtered);
        if (!selectedThreadId && filtered.length > 0) {
          setSelectedThreadId(filtered[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading threads:", error);
    }
  };

  const loadMessages = async () => {
    if (!selectedThreadId) return;
    setMessagesLoading(true);
    try {
      const res = await apiClient.getMessages(selectedThreadId);
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        if (selectedThread) {
          await apiClient.markThreadRead(selectedThreadId);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedThreadId) return;

    setSending(true);
    try {
      const res = await apiClient.sendDirectMessage(selectedThreadId, messageText);
      if (res.success) {
        setMessageText("");
        await loadMessages();
      } else {
        toast.error(res.message ?? "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred while sending the message");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredThreads = threads.filter((t) =>
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.participants?.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Direct conversations with your assigned students
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4 sm:p-6">
        {/* Thread List */}
        <div
          className={`${
            showMobileList ? "flex" : "hidden"
          } sm:flex flex-col w-full sm:w-80 bg-card border border-border rounded-xl overflow-hidden`}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    setShowMobileList(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    selectedThreadId === thread.id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {thread.subject || thread.participants?.[0]?.name || "Conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {thread.last_message?.content || "No messages yet"}
                      </p>
                    </div>
                    {thread.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(thread.last_message_at || thread.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        {selectedThread ? (
          <div className="hidden sm:flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {selectedThread.subject || selectedThread.participants?.[0]?.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedThread.participants?.length} participant(s)
                </p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">No messages in this conversation yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_id === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">{msg.sender_name}</p>
                      <p className="text-sm break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_id === user?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-border space-y-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                disabled={sending}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
                >
                  {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-col flex-1 bg-card border border-border rounded-xl items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}

        {/* Mobile Message View */}
        {selectedThreadId && !showMobileList && (
          <div className="sm:hidden flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden">
            {/* Thread Header with Back */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="font-semibold text-sm">
                  {selectedThread?.subject || selectedThread?.participants?.[0]?.name}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.sender_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium mb-0.5">{msg.sender_name}</p>
                    <p className="break-words">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border space-y-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type message..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
