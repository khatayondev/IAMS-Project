// Logbook management service
// Handles daily log entries, approval workflow, and auto-flagging for inactive students

import {
  addLogbookEntry,
  getLogbookEntries,
  getAllLogbookEntries,
  updateLogbookEntry,
  addNotification,
  getState,
  type LogbookEntry,
} from "../lib/store";
import { getSettings } from "../lib/settings-store";

export interface ServiceResult {
  success: boolean;
  message: string;
}

/**
 * Submit a new logbook entry for a student.
 */
export function submitLogbookEntry(
  studentId: string,
  date: string,
  activities: string,
  skills: string,
  challenges: string
): ServiceResult {
  if (!activities.trim()) {
    return { success: false, message: "Activities field is required." };
  }

  const entry: LogbookEntry = {
    id: `lb-${Date.now()}`,
    studentId,
    date,
    activities,
    skills,
    challenges,
    approvalStatus: "Pending",
    createdAt: new Date().toISOString(),
  };

  addLogbookEntry(entry);

  return {
    success: true,
    message: "Logbook entry submitted successfully.",
  };
}

/**
 * Get all logbook entries for a student.
 */
export function getStudentLogbook(studentId: string): LogbookEntry[] {
  return getLogbookEntries(studentId);
}

/**
 * Get all logbook entries across all students (for supervisor/admin views).
 */
export function getAllLogbooks(): LogbookEntry[] {
  return getAllLogbookEntries();
}

/**
 * Get logbook entries for multiple students.
 */
export function getLogbooksForStudents(studentIds: string[]): LogbookEntry[] {
  return getAllLogbookEntries().filter((e) => studentIds.includes(e.studentId));
}

/**
 * Approve a logbook entry (industry supervisor action).
 * After approval, the entry becomes visible/confirmed for DLO, CLO, and Academic Supervisor.
 */
export function approveLogbookEntry(
  entryId: string,
  approvedBy: string,
  comment?: string
): ServiceResult {
  const allEntries = getAllLogbookEntries();
  const entry = allEntries.find((e) => e.id === entryId);

  if (!entry) return { success: false, message: "Logbook entry not found." };

  if (entry.approvalStatus === "Approved") {
    return { success: false, message: "Entry is already approved." };
  }

  updateLogbookEntry(entryId, {
    approvalStatus: "Approved",
    approvedBy,
    approvedAt: new Date().toISOString(),
    supervisorComment: comment || entry.supervisorComment,
  });

  addNotification({
    id: `n-${Date.now()}`,
    type: "application",
    title: "Logbook Entry Approved",
    message: `${approvedBy} approved logbook entry for ${entry.date} (Student: ${entry.studentId}).`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Logbook entry for ${entry.date} approved. DLO and Academic Supervisor will be notified.`,
  };
}

/**
 * Request revision on a logbook entry (industry supervisor action).
 */
export function requestLogbookRevision(
  entryId: string,
  requestedBy: string,
  comment: string
): ServiceResult {
  const allEntries = getAllLogbookEntries();
  const entry = allEntries.find((e) => e.id === entryId);

  if (!entry) return { success: false, message: "Logbook entry not found." };

  if (!comment.trim()) {
    return { success: false, message: "Please provide a reason for the revision request." };
  }

  updateLogbookEntry(entryId, {
    approvalStatus: "Revision Requested",
    supervisorComment: comment,
  });

  addNotification({
    id: `n-${Date.now()}`,
    type: "application",
    title: "Logbook Revision Requested",
    message: `${requestedBy} requested revision for logbook entry on ${entry.date} (Student: ${entry.studentId}). Reason: ${comment}`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Revision requested for ${entry.date}. Student has been notified.`,
  };
}

/**
 * Check for inactive students (threshold from settings store).
 * Computes from actual logbook entries in the store, not static mock data.
 */
export function checkInactiveStudents(): {
  studentName: string;
  studentId: string;
  department: string;
  daysSinceLog: number;
  lastLogDate: string;
  status: "green" | "yellow" | "red";
}[] {
  const { inactivityThresholdDays, autoFlagEnabled } = getSettings();
  if (!autoFlagEnabled) return [];

  const state = getState();
  const today = new Date();

  // Build a map of studentId -> latest logbook date
  const studentLastLog = new Map<string, { date: string; name: string; dept: string }>();

  // Get student info from applications (all students in system)
  const activeStudents = state.applications.filter(
    (a) => a.status === "Active" || a.status === "Company Accepted" || a.status === "Approved"
  );

  // Initialize with application data
  for (const app of activeStudents) {
    studentLastLog.set(app.studentId, {
      date: "",
      name: app.studentName,
      dept: app.department,
    });
  }

  // Find latest logbook entry per student
  for (const entry of state.logbookEntries) {
    const existing = studentLastLog.get(entry.studentId);
    if (existing) {
      if (!existing.date || entry.date > existing.date) {
        existing.date = entry.date;
      }
    }
  }

  const results: {
    studentName: string;
    studentId: string;
    department: string;
    daysSinceLog: number;
    lastLogDate: string;
    status: "green" | "yellow" | "red";
  }[] = [];

  studentLastLog.forEach((val, studentId) => {
    const lastDate = val.date ? new Date(val.date) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago if never logged
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let status: "green" | "yellow" | "red" = "green";
    if (diffDays >= inactivityThresholdDays * 2) {
      status = "red";
    } else if (diffDays >= inactivityThresholdDays) {
      status = "yellow";
    }

    results.push({
      studentName: val.name,
      studentId,
      department: val.dept,
      daysSinceLog: diffDays,
      lastLogDate: val.date || "Never",
      status,
    });
  });

  return results.sort((a, b) => b.daysSinceLog - a.daysSinceLog);
}

/**
 * Flag an inactive student to DLO.
 */
export function flagInactiveStudent(
  studentName: string,
  department: string,
  daysSinceLog: number
): void {
  addNotification({
    id: `n-${Date.now()}`,
    type: "system",
    title: "Inactive Student Alert",
    message: `${studentName} (${department}) has not logged activity for ${daysSinceLog} days.`,
    read: false,
    timestamp: new Date().toISOString(),
  });
}