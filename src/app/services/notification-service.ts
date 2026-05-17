// Notification management service
// Handles in-app notifications, read/unread state, and role-based filtering

import { addNotification, markNotificationRead, getState } from "../lib/store";
import type { Notification } from "../lib/mock-data";
import type { ExtendedRole } from "./auth-service";

export interface ServiceResult {
  success: boolean;
  message: string;
}

/**
 * Get notifications filtered by role context.
 * CLO sees all. DLO sees department-relevant. Students see application/logbook. Others see relevant types.
 */
export function getNotifications(role: ExtendedRole, _department?: string): Notification[] {
  const all = getState().notifications;

  // Role-based type filtering
  const roleTypeMap: Record<ExtendedRole, Notification["type"][]> = {
    clo: ["application", "company", "system", "grade"], // CLO sees everything
    dlo: ["application", "company", "system", "grade"],
    student: ["application", "system"],
    supervisor: ["application", "system"],
    academic: ["application", "system", "grade"],
    hod: ["system", "grade"],
  };

  const allowedTypes = roleTypeMap[role] || ["system"];
  return all.filter((n) => allowedTypes.includes(n.type));
}

/**
 * Get unread count.
 */
export function getUnreadCount(): number {
  return getState().notifications.filter((n) => !n.read).length;
}

/**
 * Mark a single notification as read.
 */
export function readNotification(id: string): ServiceResult {
  markNotificationRead(id);
  return { success: true, message: "Notification marked as read." };
}

/**
 * Mark all notifications as read.
 */
export function markAllRead(): ServiceResult {
  const state = getState();
  state.notifications.forEach((n) => {
    if (!n.read) markNotificationRead(n.id);
  });
  return { success: true, message: "All notifications marked as read." };
}

/**
 * Send a system notification.
 */
export function sendNotification(
  type: Notification["type"],
  title: string,
  message: string
): ServiceResult {
  addNotification({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    read: false,
    timestamp: new Date().toISOString(),
  });
  return { success: true, message: "Notification sent." };
}

/**
 * Send announcement (CLO or DLO).
 */
export function sendAnnouncement(
  title: string,
  message: string,
  sentBy: string,
  targets: string[]
): ServiceResult {
  addNotification({
    id: `n-${Date.now()}-ann`,
    type: "system",
    title: `Announcement: ${title}`,
    message: `${message} (Sent by ${sentBy} to ${targets.join(", ")})`,
    read: false,
    timestamp: new Date().toISOString(),
  });
  return { success: true, message: `Announcement sent to ${targets.join(", ")}.` };
}