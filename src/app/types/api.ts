/**
 * API Request/Response Type Contracts
 * ─────────────────────────────────────
 * This file defines the exact shape of every API request and response.
 * The backend team should implement endpoints that match these contracts.
 *
 * USAGE:
 *   - Frontend services import these types for type-safe API calls.
 *   - Backend team uses this as a specification for endpoint payloads.
 *
 * NOTES:
 *   - All timestamps are ISO 8601 strings (e.g., "2026-04-19T12:00:00Z").
 *   - All IDs are strings (UUIDs recommended for production).
 *   - Paginated endpoints use { data, total, page, pageSize } wrapper.
 */

// ── Generic Wrappers ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string; // e.g., "UNAUTHORIZED", "VALIDATION_ERROR", "NOT_FOUND"
  details?: Record<string, string[]>; // Field-level validation errors
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Auth ──

export interface LoginRequest {
  email: string;
  // In production: handled via Google SSO redirect, not direct password
}

export interface MagicLinkRequest {
  token: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "clo" | "dlo" | "student" | "supervisor" | "academic" | "hod";
    department?: string;
    avatar?: string;
    studentId?: string;
  };
  token: string; // JWT or session token
  expiresAt: string;
}

// ── Applications ──

export interface CreateApplicationRequest {
  termId: string;
  companyId: string;
  coverLetter?: string;
}

export interface ApproveApplicationRequest {
  approvedBy: string;
}

export interface RejectApplicationRequest {
  rejectedBy: string;
  reason: string;
}

export interface BulkApproveRequest {
  applicationIds: string[];
  approvedBy: string;
}

export interface AssignSupervisorRequest {
  supervisorId: string;
  supervisorName: string;
  assignedBy: string;
}

export interface ApplicationFilters extends PaginationParams {
  status?: string;
  department?: string;
  search?: string;
  termId?: string;
}

export interface ApplicationResponse {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  level: string;
  companyId: string;
  companyName: string;
  companyStatus: "Approved" | "Pending";
  status: "Pending" | "Approved" | "Rejected" | "Company Accepted" | "Active" | "Completed";
  dateApplied: string;
  supervisorAssigned?: string;
  grade?: string;
  gradeStatus?: "Pending" | "Submitted" | "Approved";
}

// ── Companies ──

export interface CreateCompanyRequest {
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  department: string;
}

export interface ApproveCompanyRequest {
  approvedBy: string;
}

export interface RejectCompanyRequest {
  rejectedBy: string;
  reason: string;
}

export interface OverrideCompanyRequest {
  newStatus: "Approved" | "Rejected";
  overriddenBy: string;
  reason?: string;
}

export interface CompanyFilters extends PaginationParams {
  status?: string;
  department?: string;
  search?: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  status: "Approved" | "Pending" | "Rejected";
  addedBy: string;
  department: string;
  dateAdded: string;
  rejectionReason?: string;
}

// ── Terms ──

export interface CreateTermRequest {
  name: string;
  type: "Vacation" | "Semestrial";
  applicationStart: string;
  applicationEnd: string;
  internshipStart: string;
  internshipEnd: string;
  eligibleLevels: string[];
  departments: string[];
}

export interface UpdateTermRequest extends Partial<CreateTermRequest> {
  status?: "Upcoming" | "Active" | "Completed" | "Archived";
}

export interface TermResponse {
  id: string;
  name: string;
  type: "Vacation" | "Semestrial";
  status: "Upcoming" | "Active" | "Completed" | "Archived";
  applicationStart: string;
  applicationEnd: string;
  internshipStart: string;
  internshipEnd: string;
  eligibleLevels: string[];
  departments: string[];
}

// ── Logbook ──

export interface SubmitLogbookRequest {
  studentId: string;
  date: string;
  activities: string;
  skills: string;
  challenges: string;
}

export interface ApproveLogbookRequest {
  approvedBy: string;
  comment?: string;
}

export interface RevisionLogbookRequest {
  requestedBy: string;
  comment: string;
}

export interface LogbookFilters extends PaginationParams {
  studentId?: string;
  approvalStatus?: "Pending" | "Approved" | "Revision Requested";
  dateFrom?: string;
  dateTo?: string;
}

export interface LogbookEntryResponse {
  id: string;
  studentId: string;
  date: string;
  activities: string;
  skills: string;
  challenges: string;
  supervisorComment?: string;
  approvalStatus: "Pending" | "Approved" | "Revision Requested";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

// ── Attendance ──

export interface CheckInRequest {
  studentId: string;
  studentName: string;
  department: string;
  checkInType: "gps" | "manual";
  location: string;
  coordinates?: { lat: number; lng: number };
}

export interface VerifyCheckInRequest {
  approved: boolean;
  verifiedBy: string;
}

export interface AttendanceFilters extends PaginationParams {
  department?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  verificationStatus?: string;
}

export interface AttendanceResponse {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkInType: "gps" | "manual";
  location: string;
  verificationStatus: "Verified" | "Pending Verification" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
}

// ── Grades ──

export interface SubmitGradeRequest {
  applicationId: string;
  grade: string;
  submittedBy: string;
}

export interface ApproveGradeRequest {
  approvedBy: string;
}

export interface RevisionGradeRequest {
  requestedBy: string;
  reason: string;
}

// ── Issues ──

export interface CreateIssueRequest {
  type: "academic" | "company" | "logbook" | "supervisor" | "other";
  title: string;
  description: string;
  raisedBy: string;
  raisedByRole: string;
  department: string;
  studentId?: string;
}

export interface AddIssueNoteRequest {
  author: string;
  authorRole: string;
  content: string;
}

export interface UpdateIssueStatusRequest {
  status: "Open" | "In Progress" | "Escalated" | "Resolved";
  resolution?: string;
}

export interface IssueFilters extends PaginationParams {
  department?: string;
  status?: string;
  priority?: string;
  raisedBy?: string;
}

// ── Messages ──

export interface CreateThreadRequest {
  participantIds: string[];
  participantNames: string[];
  subject: string;
  context?: string;
  firstMessage: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
}

export interface SendMessageRequest {
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
}

// ── Notifications ──

export interface SendNotificationRequest {
  type: "application" | "company" | "grade" | "escalation" | "system";
  title: string;
  message: string;
  targetRoles?: string[];
  targetDepartment?: string;
}

export interface SendAnnouncementRequest {
  title: string;
  message: string;
  sentBy: string;
  targets: string[]; // Role names or "all"
}

// ── Settings ──

export interface SettingsRequest {
  darkMode?: boolean;
  emailNotifications?: boolean;
  autoFlagEnabled?: boolean;
  inactivityThresholdDays?: number;
}

// ── Reports ──

export interface ReportExportRequest {
  type: "applications" | "attendance" | "grades" | "companies" | "students" | "audit";
  format: "csv" | "pdf";
  filters?: {
    department?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  };
}

// ── Supervisors ──

export interface SupervisorResponse {
  id: string;
  name: string;
  email: string;
  department: string;
  currentLoad: number;
  maxLoad: number;
}
