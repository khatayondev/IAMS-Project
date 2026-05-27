// Type definitions and static reference data for the IAMS application.
// Empty collection exports are kept only to avoid import errors in pages
// pending API migration — they will be removed as each page is updated.

import type {
  DepartmentGradingConfig,
  IndustrialSupervisorAssessment,
  SiteVisitationScore,
  ReportScore,
  PresentationScore,
  CompiledGrade,
  WeeklyRubricEntry,
} from "../types/grading";

export type UserRole = "clo" | "dlo" | "academic" | "hod";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface Term {
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
  programs: string[];
}

export interface Company {
  branchCount: number;
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  industry?: string;
  status: "Approved" | "Pending" | "Rejected";
  addedBy: string;
  dateAdded: string;
  rejectionReason?: string;
  address?: string;
  contactPhone?: string;
  department?: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  region: string;
  location: string;
  address: string;
  telephone: string;
  status: "Approved" | "Pending" | "Rejected";
  addedBy: string;
  dateAdded: string;
  rejectionReason?: string;
}

export interface Application {
  termId: any;
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  level: string;
  companyId: string;
  companyName: string;
  companyStatus: "Approved" | "Pending";
  branchId?: string;
  branchName?: string;
  status: "Pending" | "Approved" | "Rejected" | "Company Accepted" | "Active" | "Completed";
  dateApplied: string;
  supervisorAssigned?: string;
  grade?: string;
  gradeStatus?: "Pending" | "Submitted" | "Approved";
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  department: string;
  currentLoad: number;
  maxLoad: number;
}

export interface Notification {
  id: string;
  type: "application" | "company" | "grade" | "escalation" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

// ── Static reference data ──

export const ghanaRegions = [
  "Ahafo Region",
  "Ashanti Region",
  "Bono Region",
  "Bono East Region",
  "Central Region",
  "Eastern Region",
  "Greater Accra Region",
  "North East Region",
  "Northern Region",
  "Oti Region",
  "Savannah Region",
  "Upper East Region",
  "Upper West Region",
  "Volta Region",
  "Western Region",
  "Western North Region",
];

export const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Accounting & Finance",
];

export const programsByDepartment: Record<string, string[]> = {
  "Computer Science": [
    "BSc Computer Science",
    "BTech Information Technology",
    "BSc Software Engineering",
    "HND Computer Science",
  ],
  "Electrical Engineering": [
    "BEng Electrical & Electronic Engineering",
    "BTech Electrical Engineering",
    "HND Electrical Engineering",
  ],
  "Mechanical Engineering": [
    "BEng Mechanical Engineering",
    "BTech Mechanical Engineering",
    "HND Mechanical Engineering",
    "HND Automotive Engineering",
  ],
  "Civil Engineering": [
    "BEng Civil Engineering",
    "BTech Civil Engineering",
    "HND Building Technology",
    "HND Civil Engineering",
  ],
  "Business Administration": [
    "BBA Business Administration",
    "BBA Marketing",
    "BBA Human Resource Management",
    "HND Marketing",
  ],
  "Accounting & Finance": [
    "BSc Accounting",
    "BSc Banking & Finance",
    "HND Accountancy",
  ],
};

export const programs: string[] = Object.values(programsByDepartment).flat();

// ── Empty stubs kept for pages pending API migration ──
// Remove each export once its consuming page is updated to use apiClient.

export const supervisors: Supervisor[] = [];
export const staffList: any[] = [];
export const departmentGradingConfigs: DepartmentGradingConfig[] = [];
export const industrialAssessments: IndustrialSupervisorAssessment[] = [];
export const siteVisitations: SiteVisitationScore[] = [];
export const reportScores: ReportScore[] = [];
export const presentationScores: PresentationScore[] = [];
export const compiledGrades: CompiledGrade[] = [];
export const weeklyRubrics: WeeklyRubricEntry[] = [];
export const studentActivity: { studentName: string; lastLogDate: string; daysSinceLog: number; status: "green" | "yellow" | "red" }[] = [];
