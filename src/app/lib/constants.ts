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

// ── Application Status — real API values ──
export const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// ── Company Approval Status — real API values ──
export const COMPANY_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];

// ── Company Active Status — real API values ──
export const COMPANY_ACTIVE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

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

// Real API attendance status values
export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  HALF_DAY: "half_day",
  EXCUSED: "excused",
} as const;

// Legacy alias kept for any code still referencing this name
export const ATTENDANCE_VERIFICATION_STATUS = ATTENDANCE_STATUS;

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
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_LOGOUT: "/api/v1/auth/logout",
  AUTH_ME: "/api/v1/auth/me",
  AUTH_REFRESH: "/api/v1/auth/refresh",
  AUTH_GOOGLE: "/api/v1/auth/google",
  AUTH_GOOGLE_CALLBACK: "/api/v1/auth/google/callback",
  AUTH_MAGIC_LINK: "/api/v1/auth/magic-link",
  AUTH_MAGIC_LINK_VERIFY: "/api/v1/auth/magic-link/verify",

  // Applications
  APPLICATIONS: "/api/v1/applications",
  APPLICATION_APPROVE: "/api/v1/applications/:id/approve",
  APPLICATION_REJECT: "/api/v1/applications/:id/reject",
  APPLICATION_BULK_APPROVE: "/api/v1/applications/bulk-approve",
  APPLICATION_ASSIGN_SUPERVISOR: "/api/v1/applications/:id/assign-supervisor",

  // Companies
  COMPANIES: "/api/v1/companies",
  COMPANY_APPROVE: "/api/v1/companies/:id/approve",
  COMPANY_REJECT: "/api/v1/companies/:id/reject",
  COMPANY_OVERRIDE: "/api/v1/companies/:id/override",

  // Terms
  TERMS: "/api/v1/terms",

  // Students
  STUDENTS: "/api/v1/students",
  STUDENT_INACTIVE: "/api/v1/students/inactive",

  // CLO users
  USERS: "/api/v1/users",
  DLOS: "/api/v1/users/dlos",

  // Logbook
  LOGBOOK_ENTRIES: "/api/v1/logbooks",
  LOGBOOK_APPROVE: "/api/v1/logbooks/:id/approve",
  LOGBOOK_REVISION: "/api/v1/logbooks/:id/comment",

  // Attendance
  ATTENDANCE: "/api/v1/attendance",
  ATTENDANCE_CHECKIN: "/api/v1/attendance/check-in",
  ATTENDANCE_VERIFY: "/api/v1/attendance/:id/verify",

  // Grades
  GRADES: "/api/v1/grades",
  GRADE_APPROVE: "/api/v1/grades/:id/approve",
  GRADE_REVISION: "/api/v1/grades/:id/revision",

  // Notifications
  NOTIFICATIONS: "/api/v1/notifications",
  NOTIFICATION_READ: "/api/v1/notifications/:id/read",
  NOTIFICATIONS_READ_ALL: "/api/v1/notifications/read-all",

  // Messages
  THREADS: "/api/v1/messages/threads",
  THREAD_MESSAGES: "/api/v1/messages/threads/:id",
  THREAD_SEND: "/api/v1/messages/threads/:id/send",
  THREAD_CREATE: "/api/v1/messages/threads",

  // Issues
  ISSUES: "/api/v1/issues",
  ISSUE_NOTE: "/api/v1/issues/:id/notes",
  ISSUE_STATUS: "/api/v1/issues/:id/status",
  ISSUE_ESCALATE: "/api/v1/issues/:id/escalate",

  // Reports & Audit
  AUDIT_LOGS: "/api/v1/audit-logs",
  REPORTS_EXPORT: "/api/v1/reports/export",

  // Settings
  SETTINGS: "/api/v1/settings",

  // Supervisors
  SUPERVISORS: "/api/v1/supervisors",

  // Application actions
  APPLICATION_SUBMIT: "/api/v1/applications/:id/submit",
  APPLICATIONS_PENDING: "/api/v1/applications/pending",

  // Company actions
  COMPANIES_PENDING: "/api/v1/companies/pending",
  COMPANY_DEACTIVATE: "/api/v1/companies/:id/deactivate",

  // Attendance
  ATTENDANCE_CHECKOUT: "/api/v1/attendance/:id/check-out",
  ATTENDANCE_MISSED: "/api/v1/attendance/missed",
  ATTENDANCE_BY_INTERNSHIP: "/api/v1/internships/:internshipId/attendance",

  // Role dashboards
  DASHBOARD_STUDENT: "/api/v1/dashboard/student",
  DASHBOARD_ACADEMIC: "/api/v1/dashboard/academic-supervisor",
  DASHBOARD_SUPERVISOR: "/api/v1/dashboard/industry-supervisor",
  DASHBOARD_DLO: "/api/v1/dashboard/dlo",
  DASHBOARD_CLO: "/api/v1/dashboard/clo",

  // Departments
  DEPARTMENTS: "/api/v1/departments",

  // Analytics
  ANALYTICS_OVERVIEW: "/api/v1/analytics/overview",
  ANALYTICS_DEPARTMENT: "/api/v1/analytics/department/:id",
  ANALYTICS_TERM: "/api/v1/analytics/term/:id",
} as const;
