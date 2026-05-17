// Auto-assignment of academic supervisors to students based on branch region,
// department, and supervisor load. All mutations go through services.

import { getState, updateApplication, addAuditLog, addNotification, setAssignmentLock } from "../lib/store";
import type { Application, Supervisor, Branch } from "../lib/mock-data";
import { supervisors as seedSupervisors } from "../lib/mock-data";

export interface EligibleStudent {
  application: Application;
  branch?: Branch;
  region: string;
  location: string;
  currentSupervisor?: string;
  locked: boolean;
}

export interface ProposedAssignment {
  applicationId: string;
  studentName: string;
  department: string;
  region: string;
  location: string;
  fromSupervisor?: string;   // existing assignment (if any)
  toSupervisor: string;      // proposed new assignment
  toSupervisorId: string;
}

export interface AutoAssignPreview {
  proposed: ProposedAssignment[];
  unassignable: { applicationId: string; studentName: string; reason: string }[];
  loadAfter: Record<string, { supervisor: Supervisor; before: number; after: number }>;
}

const ELIGIBLE_STATUSES: Application["status"][] = ["Approved", "Company Accepted", "Active"];

/** All supervisors (currently from seed; later can move into store). */
export function getSupervisors(): Supervisor[] {
  return seedSupervisors;
}

/** Students whose application is eligible for supervisor assignment. */
export function getEligibleStudents(): EligibleStudent[] {
  const { applications, branches, assignmentLocks } = getState();
  return applications
    .filter((a) => ELIGIBLE_STATUSES.includes(a.status))
    .map((a) => {
      const branch = a.branchId ? branches.find((b) => b.id === a.branchId) : undefined;
      return {
        application: a,
        branch,
        region: branch?.region ?? "—",
        location: branch?.location ?? "—",
        currentSupervisor: a.supervisorAssigned,
        locked: assignmentLocks.includes(a.id),
      };
    });
}

/**
 * Build an auto-assignment preview.
 * Algorithm:
 *  - Group eligible students by department.
 *  - For each department, gather candidate supervisors (same dept, capacity remaining).
 *  - For each unassigned/unlocked student, prefer a supervisor who already covers the
 *    student's region (their current assignees include this region). Among ties, pick
 *    the supervisor with the lowest projected load.
 *  - Locked students keep their current assignment.
 */
export function previewAutoAssign(): AutoAssignPreview {
  const eligible = getEligibleStudents();
  const supervisors = getSupervisors();

  // Per-supervisor live load and region coverage based on currently assigned eligible students.
  const liveLoad: Record<string, number> = {};
  const regionCoverage: Record<string, Set<string>> = {};
  for (const s of supervisors) {
    liveLoad[s.id] = 0;
    regionCoverage[s.id] = new Set();
  }
  for (const e of eligible) {
    if (e.currentSupervisor) {
      const sup = supervisors.find((s) => s.name === e.currentSupervisor);
      if (sup) {
        liveLoad[sup.id] = (liveLoad[sup.id] ?? 0) + 1;
        regionCoverage[sup.id].add(e.region);
      }
    }
  }

  const proposed: ProposedAssignment[] = [];
  const unassignable: AutoAssignPreview["unassignable"] = [];
  const loadBefore: Record<string, number> = { ...liveLoad };

  // Process unassigned + unlocked students; group by department for fairness within dept.
  const toAssign = eligible.filter((e) => !e.locked && !e.currentSupervisor);
  const byDept = new Map<string, EligibleStudent[]>();
  for (const e of toAssign) {
    const list = byDept.get(e.application.department) ?? [];
    list.push(e);
    byDept.set(e.application.department, list);
  }

  for (const [dept, students] of byDept) {
    const candidates = supervisors.filter((s) => s.department === dept);
    if (candidates.length === 0) {
      students.forEach((s) =>
        unassignable.push({
          applicationId: s.application.id,
          studentName: s.application.studentName,
          reason: `No supervisor available in department "${dept}".`,
        })
      );
      continue;
    }

    // Sort students so common regions are batched (helps a single supervisor cover them).
    students.sort((a, b) => a.region.localeCompare(b.region));

    for (const stu of students) {
      // Filter to candidates with remaining capacity.
      const withCapacity = candidates.filter((c) => liveLoad[c.id] < c.maxLoad);
      if (withCapacity.length === 0) {
        unassignable.push({
          applicationId: stu.application.id,
          studentName: stu.application.studentName,
          reason: `All ${dept} supervisors are at max load.`,
        });
        continue;
      }

      // Prefer supervisors who already cover this region.
      const covering = withCapacity.filter((c) => regionCoverage[c.id].has(stu.region));
      const pool = covering.length > 0 ? covering : withCapacity;
      // Pick lowest load; tiebreak by name for determinism.
      pool.sort((a, b) => liveLoad[a.id] - liveLoad[b.id] || a.name.localeCompare(b.name));
      const pick = pool[0];

      proposed.push({
        applicationId: stu.application.id,
        studentName: stu.application.studentName,
        department: dept,
        region: stu.region,
        location: stu.location,
        fromSupervisor: stu.currentSupervisor,
        toSupervisor: pick.name,
        toSupervisorId: pick.id,
      });
      liveLoad[pick.id] += 1;
      regionCoverage[pick.id].add(stu.region);
    }
  }

  const loadAfter: AutoAssignPreview["loadAfter"] = {};
  for (const s of supervisors) {
    loadAfter[s.id] = { supervisor: s, before: loadBefore[s.id] ?? 0, after: liveLoad[s.id] ?? 0 };
  }

  return { proposed, unassignable, loadAfter };
}

/** Apply a previewed assignment set. */
export function applyAutoAssign(preview: AutoAssignPreview, appliedBy: string) {
  for (const p of preview.proposed) {
    updateApplication(p.applicationId, { supervisorAssigned: p.toSupervisor });
  }
  addAuditLog({
    id: `al-${Date.now()}`,
    user: appliedBy,
    action: "Auto-Assigned Supervisors",
    target: `${preview.proposed.length} students`,
    timestamp: new Date().toISOString(),
    details:
      preview.unassignable.length > 0
        ? `${preview.unassignable.length} unassignable: ${preview.unassignable.map((u) => u.studentName).join(", ")}`
        : "All eligible students assigned successfully.",
  });
  if (preview.proposed.length > 0) {
    addNotification({
      id: `n-${Date.now()}`,
      type: "system",
      title: "Supervisor Assignments Updated",
      message: `${preview.proposed.length} student(s) assigned to academic supervisors.`,
      read: false,
      timestamp: new Date().toISOString(),
    });
  }
  return { success: true, message: `Assigned ${preview.proposed.length} student(s).` };
}

/** Manually assign / reassign one student. */
export function manualAssign(
  applicationId: string,
  supervisorName: string,
  assignedBy: string
): { success: boolean; message: string } {
  const { applications } = getState();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) return { success: false, message: "Application not found." };
  const supervisor = getSupervisors().find((s) => s.name === supervisorName);
  if (!supervisor) return { success: false, message: "Supervisor not found." };
  if (supervisor.department !== app.department) {
    return {
      success: false,
      message: `${supervisor.name} is in ${supervisor.department}, not ${app.department}.`,
    };
  }
  const previous = app.supervisorAssigned;
  updateApplication(applicationId, { supervisorAssigned: supervisorName });
  addAuditLog({
    id: `al-${Date.now()}`,
    user: assignedBy,
    action: "Manually Assigned Supervisor",
    target: `${app.studentName} → ${supervisorName}`,
    timestamp: new Date().toISOString(),
    details: previous ? `Reassigned from ${previous}.` : "Initial manual assignment.",
  });
  return { success: true, message: `${app.studentName} assigned to ${supervisorName}.` };
}

/** Toggle assignment lock. */
export function toggleAssignmentLock(applicationId: string, locked: boolean) {
  setAssignmentLock(applicationId, locked);
}

/** Clear an assignment (used when DLO needs to re-run auto for a specific student). */
export function clearAssignment(applicationId: string, clearedBy: string) {
  const { applications } = getState();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) return { success: false, message: "Application not found." };
  if (!app.supervisorAssigned) return { success: false, message: "No supervisor assigned." };
  const previous = app.supervisorAssigned;
  updateApplication(applicationId, { supervisorAssigned: undefined });
  setAssignmentLock(applicationId, false);
  addAuditLog({
    id: `al-${Date.now()}`,
    user: clearedBy,
    action: "Cleared Supervisor Assignment",
    target: app.studentName,
    timestamp: new Date().toISOString(),
    details: `Removed ${previous}.`,
  });
  return { success: true, message: `Cleared ${previous} from ${app.studentName}.` };
}
