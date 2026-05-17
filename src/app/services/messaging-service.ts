// In-system messaging service
// Covers STU-18, ACS-12, IDS-07, DLO-12, DLO-24

import { getState } from "../lib/store";

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Thread {
  id: string;
  participantIds: string[];
  participantNames: string[];
  subject: string;
  context?: string; // e.g., "Application: John Doe" or "Student: CS/2023/001"
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

// In-memory message store (mock)
let messages: Message[] = [
  {
    id: "msg-1",
    threadId: "thr-1",
    senderId: "u2",
    senderName: "Mrs. Esi Mensah",
    senderRole: "DLO",
    recipientId: "u3",
    recipientName: "John Doe",
    content: "Hi John, please upload your signed company acceptance form at your earliest convenience.",
    timestamp: "2026-04-15T09:30:00",
    read: true,
  },
  {
    id: "msg-2",
    threadId: "thr-1",
    senderId: "u3",
    senderName: "John Doe",
    senderRole: "Student",
    recipientId: "u2",
    recipientName: "Mrs. Esi Mensah",
    content: "Thank you Mrs. Mensah. I will upload it by end of day today.",
    timestamp: "2026-04-15T10:15:00",
    read: true,
  },
  {
    id: "msg-3",
    threadId: "thr-2",
    senderId: "u5",
    senderName: "Dr. Abena Osei",
    senderRole: "Academic Supervisor",
    recipientId: "u3",
    recipientName: "John Doe",
    content: "John, I noticed your logbook entry for Monday was brief. Please add more detail about the firewall configuration work.",
    timestamp: "2026-04-16T14:00:00",
    read: false,
  },
  {
    id: "msg-4",
    threadId: "thr-3",
    senderId: "u4",
    senderName: "Mr. Mensah",
    senderRole: "Industry Supervisor",
    recipientId: "u3",
    recipientName: "John Doe",
    content: "Good work on the VPN setup today. Keep it up!",
    timestamp: "2026-04-17T17:00:00",
    read: false,
  },
  {
    id: "msg-5",
    threadId: "thr-4",
    senderId: "u2",
    senderName: "Mrs. Esi Mensah",
    senderRole: "DLO",
    recipientId: "u5",
    recipientName: "Dr. Abena Osei",
    content: "Dr. Osei, could you check on Kofi Asare? He hasn't logged any entries for 3 days.",
    timestamp: "2026-04-16T11:00:00",
    read: false,
  },
];

let threads: Thread[] = [
  {
    id: "thr-1",
    participantIds: ["u2", "u3"],
    participantNames: ["Mrs. Esi Mensah", "John Doe"],
    subject: "Company Acceptance Form",
    context: "Application: John Doe",
    lastMessage: "Thank you Mrs. Mensah. I will upload it by end of day today.",
    lastTimestamp: "2026-04-15T10:15:00",
    unreadCount: 0,
  },
  {
    id: "thr-2",
    participantIds: ["u5", "u3"],
    participantNames: ["Dr. Abena Osei", "John Doe"],
    subject: "Logbook Feedback",
    context: "Logbook: John Doe",
    lastMessage: "John, I noticed your logbook entry for Monday was brief...",
    lastTimestamp: "2026-04-16T14:00:00",
    unreadCount: 1,
  },
  {
    id: "thr-3",
    participantIds: ["u4", "u3"],
    participantNames: ["Mr. Mensah", "John Doe"],
    subject: "Daily Feedback",
    context: "Supervision: John Doe",
    lastMessage: "Good work on the VPN setup today. Keep it up!",
    lastTimestamp: "2026-04-17T17:00:00",
    unreadCount: 1,
  },
  {
    id: "thr-4",
    participantIds: ["u2", "u5"],
    participantNames: ["Mrs. Esi Mensah", "Dr. Abena Osei"],
    subject: "Student Inactivity: Kofi Asare",
    context: "Student: Kofi Asare",
    lastMessage: "Dr. Osei, could you check on Kofi Asare?...",
    lastTimestamp: "2026-04-16T11:00:00",
    unreadCount: 1,
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((l) => l()); }
export function subscribeMessages(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get threads for a user.
 */
export function getThreadsForUser(userId: string): Thread[] {
  return threads.filter((t) => t.participantIds.includes(userId));
}

/**
 * Get messages in a thread.
 */
export function getMessagesInThread(threadId: string): Message[] {
  return messages.filter((m) => m.threadId === threadId);
}

/**
 * Get total unread count for a user.
 */
export function getUnreadMessageCount(userId: string): number {
  return messages.filter((m) => m.recipientId === userId && !m.read).length;
}

/**
 * Send a message in an existing thread.
 */
export function sendMessage(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  recipientId: string,
  recipientName: string,
  content: string
): { success: boolean; message: string } {
  const msg: Message = {
    id: `msg-${Date.now()}`,
    threadId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    content,
    timestamp: new Date().toISOString(),
    read: false,
  };
  messages = [...messages, msg];

  threads = threads.map((t) =>
    t.id === threadId
      ? { ...t, lastMessage: content, lastTimestamp: msg.timestamp, unreadCount: t.unreadCount + 1 }
      : t
  );

  notify();
  return { success: true, message: "Message sent." };
}

/**
 * Create a new thread.
 */
export function createThread(
  participantIds: string[],
  participantNames: string[],
  subject: string,
  context: string,
  firstMessage: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  recipientId: string,
  recipientName: string
): { success: boolean; threadId: string } {
  const threadId = `thr-${Date.now()}`;
  const thread: Thread = {
    id: threadId,
    participantIds,
    participantNames,
    subject,
    context,
    lastMessage: firstMessage,
    lastTimestamp: new Date().toISOString(),
    unreadCount: 1,
  };
  threads = [...threads, thread];

  const msg: Message = {
    id: `msg-${Date.now()}`,
    threadId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    content: firstMessage,
    timestamp: new Date().toISOString(),
    read: false,
  };
  messages = [...messages, msg];

  notify();
  return { success: true, threadId };
}

/**
 * Mark thread messages as read for a user.
 */
export function markThreadRead(threadId: string, userId: string): void {
  messages = messages.map((m) =>
    m.threadId === threadId && m.recipientId === userId ? { ...m, read: true } : m
  );
  threads = threads.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t));
  notify();
}
