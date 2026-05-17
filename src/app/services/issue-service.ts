// Issue & Escalation Tracking Service
// Covers STU-19, STU-20, DLO-25, CLO-23, SYS-16, SYS-17

export type IssueType = "academic" | "company" | "logbook" | "supervisor" | "other";
export type IssueStatus = "Open" | "In Progress" | "Escalated" | "Resolved";
export type IssuePriority = "Low" | "Medium" | "High";

export interface Issue {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  raisedBy: string;
  raisedByRole: string;
  department: string;
  studentId?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  notes: IssueNote[];
}

export interface IssueNote {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  timestamp: string;
}

// Mock issues
let issues: Issue[] = [
  {
    id: "iss-1",
    type: "company",
    title: "Unsafe working conditions at construction site",
    description: "Student reports inadequate safety equipment at Ashanti Construction Co.",
    raisedBy: "Ama Darko",
    raisedByRole: "Student",
    department: "Civil Engineering",
    studentId: "CE/2023/008",
    status: "Escalated",
    priority: "High",
    assignedTo: "CLO",
    createdAt: "2026-04-10T09:00:00",
    updatedAt: "2026-04-12T14:00:00",
    notes: [
      { id: "in-1", author: "Ama Darko", authorRole: "Student", content: "No hard hats or safety boots provided.", timestamp: "2026-04-10T09:00:00" },
      { id: "in-2", author: "Mrs. Esi Mensah", authorRole: "DLO", content: "Contacted the company. Awaiting response. Escalating to CLO.", timestamp: "2026-04-11T10:00:00" },
    ],
  },
  {
    id: "iss-2",
    type: "supervisor",
    title: "Industry supervisor unresponsive",
    description: "Student has not received any feedback from industry supervisor for 2 weeks.",
    raisedBy: "Kofi Asare",
    raisedByRole: "Student",
    department: "Business Administration",
    studentId: "BA/2023/012",
    status: "Open",
    priority: "Medium",
    assignedTo: "DLO",
    createdAt: "2026-04-14T11:30:00",
    updatedAt: "2026-04-14T11:30:00",
    notes: [],
  },
  {
    id: "iss-3",
    type: "logbook",
    title: "Logbook entry rejected unfairly",
    description: "Academic supervisor rejected logbook entry without clear reason.",
    raisedBy: "John Doe",
    raisedByRole: "Student",
    department: "Computer Science",
    studentId: "CS/2023/001",
    status: "Resolved",
    priority: "Low",
    assignedTo: "DLO",
    resolution: "Supervisor clarified feedback. Entry updated and re-approved.",
    createdAt: "2026-04-08T15:00:00",
    updatedAt: "2026-04-09T10:00:00",
    notes: [
      { id: "in-3", author: "Mrs. Esi Mensah", authorRole: "DLO", content: "Spoke with Dr. Osei. The rejection was due to missing detail. Student updated entry.", timestamp: "2026-04-09T10:00:00" },
    ],
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((l) => l()); }
export function subscribeIssues(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIssues(filters?: { department?: string; status?: IssueStatus; raisedBy?: string }): Issue[] {
  let result = [...issues];
  if (filters?.department) result = result.filter((i) => i.department === filters.department);
  if (filters?.status) result = result.filter((i) => i.status === filters.status);
  if (filters?.raisedBy) result = result.filter((i) => i.raisedBy === filters.raisedBy);
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getIssueById(id: string): Issue | undefined {
  return issues.find((i) => i.id === id);
}

export function createIssue(
  type: IssueType,
  title: string,
  description: string,
  raisedBy: string,
  raisedByRole: string,
  department: string,
  studentId?: string
): { success: boolean; message: string } {
  const issue: Issue = {
    id: `iss-${Date.now()}`,
    type,
    title,
    description,
    raisedBy,
    raisedByRole,
    department,
    studentId,
    status: "Open",
    priority: "Medium",
    assignedTo: type === "company" ? "CLO" : "DLO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [],
  };
  issues = [issue, ...issues];
  notify();
  return { success: true, message: "Issue reported successfully. It has been routed for review." };
}

export function addIssueNote(
  issueId: string,
  author: string,
  authorRole: string,
  content: string
): { success: boolean; message: string } {
  issues = issues.map((i) =>
    i.id === issueId
      ? {
          ...i,
          updatedAt: new Date().toISOString(),
          notes: [
            ...i.notes,
            { id: `in-${Date.now()}`, author, authorRole, content, timestamp: new Date().toISOString() },
          ],
        }
      : i
  );
  notify();
  return { success: true, message: "Note added." };
}

export function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  resolution?: string
): { success: boolean; message: string } {
  issues = issues.map((i) =>
    i.id === issueId
      ? { ...i, status, resolution: resolution || i.resolution, updatedAt: new Date().toISOString() }
      : i
  );
  notify();
  return { success: true, message: `Issue status updated to ${status}.` };
}

export function escalateIssue(issueId: string, escalatedBy: string): { success: boolean; message: string } {
  issues = issues.map((i) =>
    i.id === issueId
      ? {
          ...i,
          status: "Escalated" as IssueStatus,
          assignedTo: "CLO",
          updatedAt: new Date().toISOString(),
          notes: [
            ...i.notes,
            { id: `in-${Date.now()}`, author: escalatedBy, authorRole: "DLO", content: "Issue escalated to CLO for resolution.", timestamp: new Date().toISOString() },
          ],
        }
      : i
  );
  notify();
  return { success: true, message: "Issue escalated to CLO." };
}
