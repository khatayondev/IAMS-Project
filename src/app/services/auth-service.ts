// Authentication & Authorization Service
// In production, this would use Auth.js (NextAuth) with Google Provider
// For now, simulates Google SSO for @htu.edu.gh domain

import type { UserRole } from "../lib/mock-data";

export type ExtendedRole = UserRole | "student" | "supervisor" | "academic" | "hod";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ExtendedRole;
  department?: string;
  avatar?: string;
  studentId?: string;
  // For external supervisors — magic link token
  supervisorToken?: string;
}

// Simulated user accounts
const userAccounts: AuthUser[] = [
  {
    id: "u1",
    name: "Dr. Kwame Asante",
    email: "k.asante@htu.edu.gh",
    role: "clo",
  },
  {
    id: "u2",
    name: "Mrs. Esi Mensah",
    email: "e.mensah@htu.edu.gh",
    role: "dlo",
    department: "Computer Science",
  },
  {
    id: "u3",
    name: "John Doe",
    email: "john.doe@st.htu.edu.gh",
    role: "student",
    department: "Computer Science",
    studentId: "CS/2023/001",
  },
  // Demo student in Active state — for showcasing the in-progress tracker.
  {
    id: "u3a",
    name: "Kofi Asare",
    email: "kofi.asare@st.htu.edu.gh",
    role: "student",
    department: "Business Administration",
    studentId: "BA/2023/012",
  },
  // Demo student in Completed state — for showcasing the post-internship view.
  {
    id: "u3b",
    name: "Jane Smith",
    email: "jane.smith@st.htu.edu.gh",
    role: "student",
    department: "Electrical Engineering",
    studentId: "EE/2023/015",
  },
  {
    id: "u4",
    name: "Mr. Mensah",
    email: "mensah@ghtel.com",
    role: "supervisor",
    supervisorToken: "sup-tok-abc123",
  },
  {
    id: "u5",
    name: "Dr. Abena Osei",
    email: "a.osei@htu.edu.gh",
    role: "academic",
    department: "Computer Science",
  },
  {
    id: "u6",
    name: "Prof. Yaw Mensah",
    email: "y.mensah@htu.edu.gh",
    role: "hod",
    department: "Computer Science",
  },
];

export function authenticateByEmail(email: string): AuthUser | null {
  return userAccounts.find((u) => u.email === email) || null;
}

export function authenticateByToken(token: string): AuthUser | null {
  return userAccounts.find((u) => u.supervisorToken === token) || null;
}

export function isHTUEmail(email: string): boolean {
  return email.endsWith("@htu.edu.gh") || email.endsWith("@st.htu.edu.gh");
}

// Role-based access control checks
const rolePermissions: Record<ExtendedRole, string[]> = {
  clo: [
    "view:all_departments",
    "manage:terms",
    "manage:templates",
    "manage:users",
    "approve:companies",
    "override:company_decisions",
    "approve:applications",
    "override:applications",
    "assign:supervisors",
    "override:supervisors",
    "approve:grades",
    "view:audit_logs",
    "manage:settings",
    "archive:terms",
    "export:reports",
    "send:announcements",
  ],
  dlo: [
    "view:own_department",
    "approve:companies",
    "approve:applications",
    "assign:supervisors",
    "approve:grades",
    "view:students",
    "send:dept_announcements",
    "export:dept_reports",
    "manage:dept_settings",
  ],
  student: [
    "apply:attachment",
    "submit:logbook",
    "upload:documents",
    "view:own_status",
    "view:own_logbook",
  ],
  supervisor: [
    "view:assigned_students",
    "submit:evaluation",
    "view:logbook",
  ],
  academic: [
    "view:assigned_students",
    "view:logbook",
    "submit:evaluation",
    "submit:grades",
  ],
  hod: [
    "view:own_department",
    "view:dept_reports",
    "view:dept_students",
  ],
};

export function hasPermission(role: ExtendedRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getRoutePrefix(role: ExtendedRole): string {
  switch (role) {
    case "clo":
      return "/clo";
    case "dlo":
      return "/dlo";
    case "student":
      return "/student";
    case "supervisor":
      return "/supervisor";
    case "academic":
      return "/academic";
    case "hod":
      return "/hod";
    default:
      return "/";
  }
}

export function getAllowedRoutes(role: ExtendedRole): string[] {
  switch (role) {
    case "clo":
      return [
        "/clo",
        "/clo/applications",
        "/clo/companies",
        "/clo/terms",
        "/clo/users",
        "/clo/students",
        "/clo/grades",
        "/clo/reports",
        "/clo/audit",
        "/clo/templates",
        "/clo/settings",
        "/clo/issues",
        "/clo/attendance",
        "/clo/communications",
      ];
    case "dlo":
      return [
        "/dlo",
        "/dlo/applications",
        "/dlo/companies",
        "/dlo/students",
        "/dlo/supervisors",
        "/dlo/grades",
        "/dlo/reports",
        "/dlo/settings",
        "/dlo/issues",
        "/dlo/attendance",
        "/dlo/communications",
      ];
    case "student":
      return ["/student", "/student/applications", "/student/logbook", "/student/documents", "/student/grades", "/student/issues", "/student/communications"];
    case "supervisor":
      return ["/supervisor", "/supervisor/evaluate", "/supervisor/logbooks", "/supervisor/attendance", "/supervisor/communications"];
    case "academic":
      return ["/academic", "/academic/students", "/academic/evaluate", "/academic/grades", "/academic/visits", "/academic/attendance", "/academic/communications"];
    case "hod":
      return ["/hod", "/hod/reports", "/hod/students", "/hod/approvals", "/hod/communications"];
    default:
      return [];
  }
}