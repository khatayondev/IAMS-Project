// Mock data for the Industrial Attachment Management System

import type {
  DepartmentGradingConfig,
  IndustrialSupervisorAssessment,
  SiteVisitationScore,
  ReportScore,
  PresentationScore,
  CompiledGrade,
  CriterionRating,
  WeeklyRubricEntry,
} from "../types/grading";
import {
  DEFAULT_STRUCTURE_WEIGHTS,
  DEFAULT_SECTION_WEIGHTS,
} from "./constants";

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
  // Empty array means "all programs across the selected departments".
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
  // Legacy fields kept optional for back-compat with older views.
  // New flows source address/phone from Branch records.
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

// Current user state
export const currentUser: User = {
  id: "u1",
  name: "Dr. Kwame Asante",
  email: "k.asante@htu.edu.gh",
  role: "clo",
  avatar: "",
};

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

// Programs grouped by department. In production these would be fetched from
// the student records API rather than hard-coded.
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

// Flat list of all programs across departments (convenience for selectors).
export const programs: string[] = Object.values(programsByDepartment).flat();

export const terms: Term[] = [];

export const companies: Company[] = [
  {
    id: "c1", name: "Ghana Telecom Ltd", address: "Independence Ave, Accra", contactPerson: "Mr. Mensah", contactEmail: "mensah@ghtel.com", contactPhone: "+233201234567", industry: "Telecommunications", status: "Approved", addedBy: "John Doe", department: "Computer Science", dateAdded: "2026-03-02",
    branchCount: 0
  },
  {
    id: "c2", name: "Volta River Authority", address: "28th Feb Road, Accra", contactPerson: "Eng. Boateng", contactEmail: "boateng@vra.gov.gh", contactPhone: "+233209876543", industry: "Energy", status: "Approved", addedBy: "Jane Smith", department: "Electrical Engineering", dateAdded: "2026-03-03",
    branchCount: 0
  },
  {
    id: "c3", name: "TechHub Ghana", address: "Osu, Accra", contactPerson: "Ms. Adjei", contactEmail: "adjei@techhub.gh", contactPhone: "+233241112233", industry: "Technology", status: "Pending", addedBy: "Kwesi Mensah", department: "Computer Science", dateAdded: "2026-03-10",
    branchCount: 0
  },
  {
    id: "c4", name: "Ashanti Construction Co.", address: "Kumasi CBD", contactPerson: "Mr. Owusu", contactEmail: "owusu@ashconst.com", contactPhone: "+233272223344", industry: "Construction", status: "Pending", addedBy: "Ama Darko", department: "Civil Engineering", dateAdded: "2026-03-11",
    branchCount: 0
  },
  {
    id: "c5", name: "GoldFields Mining", address: "Tarkwa", contactPerson: "Dr. Antwi", contactEmail: "antwi@goldfields.com", contactPhone: "+233303334455", industry: "Mining", status: "Approved", addedBy: "Yaw Frimpong", department: "Mechanical Engineering", dateAdded: "2026-02-28",
    branchCount: 0
  },
  {
    id: "c6", name: "Stanbic Bank Ghana", address: "Airport City, Accra", contactPerson: "Mrs. Osei", contactEmail: "osei@stanbic.gh", contactPhone: "+233244556677", industry: "Banking", status: "Rejected", addedBy: "Akua Manu", department: "Accounting & Finance", dateAdded: "2026-03-05", rejectionReason: "Company does not meet department requirements",
    branchCount: 0
  },
];

// One "Main Branch" auto-seeded per company so existing applications can link.
// Additional branches added below for a couple companies to exercise the multi-branch UX.
export const branches: Branch[] = [
  { id: "b-c1-main", companyId: "c1", name: "Head Office", region: "Greater Accra Region", location: "Accra", address: "Independence Ave, Accra", telephone: "+233201234567", status: "Approved", addedBy: "John Doe", dateAdded: "2026-03-02" },
  { id: "b-c1-kumasi", companyId: "c1", name: "Kumasi Branch", region: "Ashanti Region", location: "Kumasi", address: "Adum, Kumasi", telephone: "+233207778899", status: "Approved", addedBy: "Mrs. Esi Mensah", dateAdded: "2026-03-04" },
  { id: "b-c2-main", companyId: "c2", name: "Akosombo Plant", region: "Eastern Region", location: "Akosombo", address: "Akosombo Generating Station", telephone: "+233209876543", status: "Approved", addedBy: "Jane Smith", dateAdded: "2026-03-03" },
  { id: "b-c2-accra", companyId: "c2", name: "Accra Office", region: "Greater Accra Region", location: "Accra", address: "28th Feb Road, Accra", telephone: "+233209876500", status: "Approved", addedBy: "Mrs. Esi Mensah", dateAdded: "2026-03-03" },
  { id: "b-c3-main", companyId: "c3", name: "Osu HQ", region: "Greater Accra Region", location: "Accra", address: "Osu, Accra", telephone: "+233241112233", status: "Pending", addedBy: "Kwesi Mensah", dateAdded: "2026-03-10" },
  { id: "b-c4-main", companyId: "c4", name: "Kumasi Site", region: "Ashanti Region", location: "Kumasi", address: "Kumasi CBD", telephone: "+233272223344", status: "Pending", addedBy: "Ama Darko", dateAdded: "2026-03-11" },
  { id: "b-c5-main", companyId: "c5", name: "Tarkwa Mine", region: "Western Region", location: "Tarkwa", address: "Tarkwa Mine Site", telephone: "+233303334455", status: "Approved", addedBy: "Yaw Frimpong", dateAdded: "2026-02-28" },
  { id: "b-c6-main", companyId: "c6", name: "Airport City Branch", region: "Greater Accra Region", location: "Accra", address: "Airport City, Accra", telephone: "+233244556677", status: "Rejected", addedBy: "Akua Manu", dateAdded: "2026-03-05", rejectionReason: "Parent company rejected" },
];

export const applications: Application[] = [];

export const supervisors: Supervisor[] = [
  { id: "s1", name: "Dr. Agyeman", email: "agyeman@htu.edu.gh", department: "Computer Science", currentLoad: 4, maxLoad: 8 },
  { id: "s7", name: "Dr. Owusu", email: "owusu@htu.edu.gh", department: "Computer Science", currentLoad: 0, maxLoad: 6 },
  { id: "s2", name: "Prof. Danso", email: "danso@htu.edu.gh", department: "Electrical Engineering", currentLoad: 6, maxLoad: 8 },
  { id: "s3", name: "Dr. Mensah", email: "mensah@htu.edu.gh", department: "Business Administration", currentLoad: 3, maxLoad: 6 },
  { id: "s4", name: "Mr. Appiah", email: "appiah@htu.edu.gh", department: "Accounting & Finance", currentLoad: 5, maxLoad: 7 },
  { id: "s5", name: "Dr. Ofori", email: "ofori@htu.edu.gh", department: "Mechanical Engineering", currentLoad: 2, maxLoad: 6 },
  { id: "s6", name: "Eng. Tetteh", email: "tetteh@htu.edu.gh", department: "Civil Engineering", currentLoad: 1, maxLoad: 5 },
];

export const notifications: Notification[] = [
  { id: "n1", type: "company", title: "New Company Pending", message: "TechHub Ghana needs approval (Computer Science)", read: false, timestamp: "2026-03-10T10:30:00" },
  { id: "n2", type: "company", title: "New Company Pending", message: "Ashanti Construction Co. needs approval (Civil Engineering)", read: false, timestamp: "2026-03-11T09:15:00" },
  { id: "n3", type: "application", title: "Applications Ready", message: "3 new applications pending review", read: false, timestamp: "2026-03-12T08:00:00" },
  { id: "n4", type: "grade", title: "Grade Ready for Approval", message: "Efua Mensah's final grade submitted by Mr. Appiah", read: true, timestamp: "2026-03-09T14:20:00" },
  { id: "n5", type: "application", title: "Company Acceptance", message: "Yaw Frimpong has uploaded signed acceptance form", read: false, timestamp: "2026-03-08T11:45:00" },
  { id: "n6", type: "system", title: "Term Reminder", message: "Application deadline for 2026 L300 Semestrial Internship ends in 3 days", read: true, timestamp: "2026-03-12T07:00:00" },
];

export const auditLogs: AuditLog[] = [
  { id: "al1", user: "Dr. Kwame Asante", action: "Created Term", target: "2026 L300 Semestrial Internship", timestamp: "2026-02-25T10:00:00", details: "Term created with semestrial type" },
  { id: "al2", user: "Dr. Kwame Asante", action: "Approved Company", target: "Ghana Telecom Ltd", timestamp: "2026-03-02T14:30:00", details: "Company approved for system-wide access" },
  { id: "al3", user: "Mrs. Esi Mensah", action: "Approved Application", target: "John Doe (CS/2023/001)", timestamp: "2026-03-06T09:00:00", details: "Application approved, placement letter generated" },
  { id: "al4", user: "Mrs. Esi Mensah", action: "Assigned Supervisor", target: "John Doe → Dr. Agyeman", timestamp: "2026-03-07T11:20:00", details: "Academic supervisor assigned after company acceptance" },
  { id: "al5", user: "Dr. Kwame Asante", action: "Updated Template", target: "Placement Letter Template", timestamp: "2026-02-20T16:00:00", details: "New letterhead uploaded" },
];

export const staffList = [
  { id: "st1", name: "Mrs. Esi Mensah", email: "e.mensah@htu.edu.gh", department: "Computer Science", isLiaison: true },
  { id: "st2", name: "Dr. Kofi Amankwah", email: "k.amankwah@htu.edu.gh", department: "Electrical Engineering", isLiaison: true },
  { id: "st3", name: "Prof. Adjoa Serwaa", email: "a.serwaa@htu.edu.gh", department: "Mechanical Engineering", isLiaison: false },
  { id: "st4", name: "Mr. Yaw Donkor", email: "y.donkor@htu.edu.gh", department: "Civil Engineering", isLiaison: true },
  { id: "st5", name: "Dr. Akua Badu", email: "a.badu@htu.edu.gh", department: "Business Administration", isLiaison: false },
  { id: "st6", name: "Mrs. Nana Addo", email: "n.addo@htu.edu.gh", department: "Accounting & Finance", isLiaison: true },
];

// ── Grading: per-department configurations seeded for active term (t1) ──
// Mix of statuses so HOD has something pending, others already locked.
const TERM_ID = "t1";
const seedTimestamp = "2026-03-01T09:00:00";

function ratings(values: number[]): Record<string, CriterionRating> {
  // 20 criteria — A1-A4 (4), B1-B8 (8), C1-C5 (5), D1-D3 (3).
  // Older 18-value seed arrays are auto-padded for B7/B8 with a default 3.
  const keys = [
    "A1", "A2", "A3", "A4",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8",
    "C1", "C2", "C3", "C4", "C5",
    "D1", "D2", "D3",
  ];
  const out: Record<string, CriterionRating> = {} as any;
  // If the caller passed the legacy 18-length array (pre-B7/B8), splice in defaults.
  let v = values;
  if (values.length === 18) {
    v = [
      ...values.slice(0, 10),  // A1-A4 + B1-B6
      3, 3,                     // B7, B8 (default Average)
      ...values.slice(10),      // C1-C5 + D1-D3
    ];
  }
  keys.forEach((k, i) => { out[k] = (v[i] ?? 3) as CriterionRating; });
  return out;
}

export const departmentGradingConfigs: DepartmentGradingConfig[] = [
  // Computer Science — Structure C, fully active (HOD-approved)
  {
    id: "gc-cs", departmentId: "Computer Science", termId: TERM_ID,
    structure: "C", structureWeights: { w1: 40, w2: 30, w3: 15, w4: 15 }, sectionWeights: { ...DEFAULT_SECTION_WEIGHTS },
    status: "active",
    createdBy: "Mrs. Esi Mensah", createdAt: seedTimestamp,
    updatedBy: "Mrs. Esi Mensah", updatedAt: seedTimestamp,
    submittedForApprovalBy: "Mrs. Esi Mensah", submittedForApprovalAt: seedTimestamp,
    approvedBy: "Prof. Charles Owusu", approvedAt: "2026-03-02T10:00:00", lockedAt: "2026-03-02T10:00:00",
  },
  // Electrical Engineering — Structure A (Report only), active
  {
    id: "gc-ee", departmentId: "Electrical Engineering", termId: TERM_ID,
    structure: "A", structureWeights: { w1: 40, w2: 30, w3: 30 }, sectionWeights: { a: 30, b: 25, c: 25, d: 20 },
    status: "active",
    createdBy: "Dr. Kofi Amankwah", createdAt: seedTimestamp,
    updatedBy: "Dr. Kofi Amankwah", updatedAt: seedTimestamp,
    submittedForApprovalBy: "Dr. Kofi Amankwah", submittedForApprovalAt: seedTimestamp,
    approvedBy: "Prof. Adwoa Mensah", approvedAt: "2026-03-02T11:00:00", lockedAt: "2026-03-02T11:00:00",
  },
  // Mechanical Engineering — Structure B (Presentation only), pending HOD approval
  {
    id: "gc-me", departmentId: "Mechanical Engineering", termId: TERM_ID,
    structure: "B", structureWeights: { w1: 40, w2: 30, w3: 30 }, sectionWeights: { ...DEFAULT_SECTION_WEIGHTS },
    status: "pending_approval",
    createdBy: "Prof. Adjoa Serwaa", createdAt: seedTimestamp,
    updatedBy: "Prof. Adjoa Serwaa", updatedAt: seedTimestamp,
    submittedForApprovalBy: "Prof. Adjoa Serwaa", submittedForApprovalAt: "2026-03-08T14:00:00",
  },
  // Civil Engineering — draft (not yet submitted)
  {
    id: "gc-ce", departmentId: "Civil Engineering", termId: TERM_ID,
    structure: "C", structureWeights: { w1: 40, w2: 30, w3: 20, w4: 10 }, sectionWeights: { ...DEFAULT_SECTION_WEIGHTS },
    status: "draft",
    createdBy: "Mr. Yaw Donkor", createdAt: seedTimestamp,
    updatedBy: "Mr. Yaw Donkor", updatedAt: "2026-03-09T10:00:00",
  },
  // Business Administration & Accounting & Finance — no config yet → falls back to default
];

export const industrialAssessments: IndustrialSupervisorAssessment[] = [];

export const siteVisitations: SiteVisitationScore[] = [];

export const reportScores: ReportScore[] = [];

export const presentationScores: PresentationScore[] = [];

export const compiledGrades: CompiledGrade[] = [];

export const weeklyRubrics: WeeklyRubricEntry[] = [];

export const studentActivity: { studentName: string; lastLogDate: string; daysSinceLog: number; status: "green" | "yellow" | "red" }[] = [];
