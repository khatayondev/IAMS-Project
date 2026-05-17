// Centralized constants and enums
// Eliminates magic strings across the codebase

// ── Role Constants ──
export const ROLES = {
  CLO: "clo",
  DLO: "dlo",
  STUDENT: "student",
  SUPERVISOR: "supervisor",
  ACADEMIC: "academic",
  HOD: "hod",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  clo: "Central Liaison Officer",
  dlo: "Departmental Liaison Officer",
  student: "Student",
  supervisor: "Industry Supervisor",
  academic: "Academic Supervisor",
  hod: "Head of Department",
};

// ── Application Status ──
export const APPLICATION_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPANY_ACCEPTED: "Company Accepted",
  ACTIVE: "Active",
  COMPLETED: "Completed",
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// ── Company Status ──
export const COMPANY_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];

// ── Term Status ──
export const TERM_STATUS = {
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
} as const;

export type TermStatus = (typeof TERM_STATUS)[keyof typeof TERM_STATUS];

// ── Logbook Approval Status ──
export const LOGBOOK_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REVISION_REQUESTED: "Revision Requested",
} as const;

export type LogbookApprovalStatus = (typeof LOGBOOK_STATUS)[keyof typeof LOGBOOK_STATUS];

// ── Grade Status ──
export const GRADE_STATUS = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
} as const;

export type GradeStatus = (typeof GRADE_STATUS)[keyof typeof GRADE_STATUS];

// ── Attendance ──
export const ATTENDANCE_CHECKIN_TYPE = {
  GPS: "gps",
  MANUAL: "manual",
} as const;

export const ATTENDANCE_VERIFICATION_STATUS = {
  VERIFIED: "Verified",
  PENDING: "Pending Verification",
  REJECTED: "Rejected",
} as const;

// ── Issue Status & Priority ──
export const ISSUE_STATUS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
} as const;

export const ISSUE_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export const ISSUE_TYPES = {
  ACADEMIC: "academic",
  COMPANY: "company",
  LOGBOOK: "logbook",
  SUPERVISOR: "supervisor",
  OTHER: "other",
} as const;

// ── Notification Types ──
export const NOTIFICATION_TYPES = {
  APPLICATION: "application",
  COMPANY: "company",
  GRADE: "grade",
  ESCALATION: "escalation",
  SYSTEM: "system",
} as const;

// ── Departments ──
export const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Accounting & Finance",
] as const;

// ── Industrial Supervisor Assessment Criteria (20 criteria, 4 sections) ──
import type { IndustrialCriterion, SectionWeights, StructureWeights, GradingStructure, WeeklyRubricCriterion, WeeklyRubric4PtRating, WeeklyRubric3PtRating } from "../types/grading";

export const INDUSTRIAL_CRITERIA: IndustrialCriterion[] = [
  // Section A — Specific Skills
  { key: "A1", section: "A", label: "Technical Skills" },
  { key: "A2", section: "A", label: "Analytical Skills" },
  { key: "A3", section: "A", label: "Creative Skills" },
  { key: "A4", section: "A", label: "Communication Skills" },
  // Section B — General Employability Skills
  { key: "B1", section: "B", label: "Ability to complete work on schedule" },
  { key: "B2", section: "B", label: "Ability to follow instructions carefully" },
  { key: "B3", section: "B", label: "Ability to take initiative" },
  { key: "B4", section: "B", label: "Ability to work with little supervision" },
  { key: "B5", section: "B", label: "Ability to work with other staff" },
  { key: "B6", section: "B", label: "Adherence to organisation's rules and regulations" },
  { key: "B7", section: "B", label: "Adherence to safety and environmental rules" },
  { key: "B8", section: "B", label: "Resourcefulness" },
  // Section C — Attitude to Work
  { key: "C1", section: "C", label: "Attendance at work" },
  { key: "C2", section: "C", label: "Punctuality" },
  { key: "C3", section: "C", label: "Desire to work" },
  { key: "C4", section: "C", label: "Willingness to accept new ideas and suggestions" },
  { key: "C5", section: "C", label: "Loyalty to the organisation" },
  // Section D — Human Relations
  { key: "D1", section: "D", label: "Relationship with co-workers" },
  { key: "D2", section: "D", label: "Relationship with superiors" },
  { key: "D3", section: "D", label: "Emotional stability" },
];

export const SECTION_LABELS: Record<"A" | "B" | "C" | "D", string> = {
  A: "Specific Skills",
  B: "General Employability Skills",
  C: "Attitude to Work",
  D: "Human Relations",
};

// ── Weekly Assessment Rubric (NOT scored) ──
// Filled once per week of the attachment by the Industrial Supervisor.
export const WEEKLY_RUBRIC_CRITERIA: WeeklyRubricCriterion[] = [
  { key: "WR1", label: "Attendance", scale: "4pt" },
  { key: "WR2", label: "Discipline", scale: "4pt" },
  { key: "WR3", label: "Punctuality", scale: "4pt" },
  { key: "WR4", label: "Ability to complete work on schedule", scale: "3pt" },
  { key: "WR5", label: "Ability to work under pressure", scale: "3pt" },
  { key: "WR6", label: "General Aptitude", scale: "3pt" },
];

export const WEEKLY_RUBRIC_4PT_OPTIONS: WeeklyRubric4PtRating[] = ["Poor", "Satisfactory", "Good", "Very Good"];
export const WEEKLY_RUBRIC_3PT_OPTIONS: WeeklyRubric3PtRating[] = ["Weak", "Average", "Above Average"];

export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Weak",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Outstanding",
};

// Default config seeded for any department that hasn't configured yet (Q5).
// Structure C — Industrial 40 / Departmental 30 / Report 15 / Presentation 15.
export const DEFAULT_STRUCTURE: GradingStructure = "C";
export const DEFAULT_STRUCTURE_WEIGHTS: StructureWeights = { w1: 40, w2: 30, w3: 15, w4: 15 };
export const DEFAULT_SECTION_WEIGHTS: SectionWeights = { a: 25, b: 25, c: 25, d: 25 };

// ── Grading Config Status ──
export const GRADING_CONFIG_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  ACTIVE: "active",
} as const;

// ── API Endpoints (for backend team reference) ──
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
  AUTH_MAGIC_LINK: "/api/auth/magic-link",

  // Applications
  APPLICATIONS: "/api/applications",
  APPLICATION_APPROVE: "/api/applications/:id/approve",
  APPLICATION_REJECT: "/api/applications/:id/reject",
  APPLICATION_BULK_APPROVE: "/api/applications/bulk-approve",
  APPLICATION_ASSIGN_SUPERVISOR: "/api/applications/:id/assign-supervisor",

  // Companies
  COMPANIES: "/api/companies",
  COMPANY_APPROVE: "/api/companies/:id/approve",
  COMPANY_REJECT: "/api/companies/:id/reject",
  COMPANY_OVERRIDE: "/api/companies/:id/override",

  // Terms
  TERMS: "/api/terms",

  // Students
  STUDENTS: "/api/students",
  STUDENT_INACTIVE: "/api/students/inactive",

  // Logbook
  LOGBOOK_ENTRIES: "/api/logbook",
  LOGBOOK_APPROVE: "/api/logbook/:id/approve",
  LOGBOOK_REVISION: "/api/logbook/:id/revision",

  // Attendance
  ATTENDANCE: "/api/attendance",
  ATTENDANCE_CHECKIN: "/api/attendance/check-in",
  ATTENDANCE_VERIFY: "/api/attendance/:id/verify",

  // Grades
  GRADES: "/api/grades",
  GRADE_APPROVE: "/api/grades/:id/approve",
  GRADE_REVISION: "/api/grades/:id/revision",

  // Notifications
  NOTIFICATIONS: "/api/notifications",
  NOTIFICATION_READ: "/api/notifications/:id/read",
  NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",

  // Messages
  THREADS: "/api/messages/threads",
  THREAD_MESSAGES: "/api/messages/threads/:id",
  THREAD_SEND: "/api/messages/threads/:id/send",
  THREAD_CREATE: "/api/messages/threads",

  // Issues
  ISSUES: "/api/issues",
  ISSUE_NOTE: "/api/issues/:id/notes",
  ISSUE_STATUS: "/api/issues/:id/status",
  ISSUE_ESCALATE: "/api/issues/:id/escalate",

  // Reports & Audit
  AUDIT_LOGS: "/api/audit-logs",
  REPORTS_EXPORT: "/api/reports/export",

  // Settings
  SETTINGS: "/api/settings",

  // Supervisors
  SUPERVISORS: "/api/supervisors",
} as const;
