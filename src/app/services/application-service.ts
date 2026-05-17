// Application review, approval, and document generation business logic

import {
  updateApplication,
  addAuditLog,
  addNotification,
  getState,
} from "../lib/store";
import type { Application } from "../lib/mock-data";

export interface ServiceResult {
  success: boolean;
  message: string;
}

/**
 * Approve an application.
 * Pre-conditions:
 *   1. Company must already be approved (is_verified).
 *   2. Application status must be "Pending".
 * On success: generates Placement Letter + Company Acceptance Form PDF (simulated).
 */
export function approveApplication(
  applicationId: string,
  approvedBy: string
): ServiceResult {
  const state = getState();
  const app = state.applications.find((a) => a.id === applicationId);

  if (!app) return { success: false, message: "Application not found." };

  if (app.status !== "Pending") {
    return {
      success: false,
      message: `Cannot approve: application is "${app.status}", not "Pending".`,
    };
  }

  // Check company approval status
  const company = state.companies.find((c) => c.id === app.companyId);
  if (company && company.status !== "Approved") {
    return {
      success: false,
      message: `Cannot approve: company "${company.name}" is not yet approved. Approve the company first.`,
    };
  }

  updateApplication(applicationId, { status: "Approved" });

  addAuditLog({
    id: `al-${Date.now()}`,
    user: approvedBy,
    action: "Approved Application",
    target: `${app.studentName} (${app.studentId})`,
    timestamp: new Date().toISOString(),
    details: "Application approved. Placement Letter and Company Acceptance Form PDF generated.",
  });

  addNotification({
    id: `n-${Date.now()}`,
    type: "application",
    title: "Application Approved",
    message: `${app.studentName}'s application to ${app.companyName} has been approved. Documents generated.`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Application approved. Placement Letter and Company Acceptance Form generated for ${app.studentName}.`,
  };
}

/**
 * Reject an application with reason.
 */
export function rejectApplication(
  applicationId: string,
  rejectedBy: string,
  reason: string
): ServiceResult {
  const state = getState();
  const app = state.applications.find((a) => a.id === applicationId);

  if (!app) return { success: false, message: "Application not found." };

  updateApplication(applicationId, { status: "Rejected" });

  addAuditLog({
    id: `al-${Date.now()}`,
    user: rejectedBy,
    action: "Rejected Application",
    target: `${app.studentName} (${app.studentId})`,
    timestamp: new Date().toISOString(),
    details: `Reason: ${reason || "Not specified"}`,
  });

  return {
    success: true,
    message: `Application rejected. ${app.studentName} has been notified.`,
  };
}

/**
 * Bulk approve multiple applications.
 * Only approves applications where the company is already approved.
 */
export function bulkApproveApplications(
  applicationIds: string[],
  approvedBy: string
): ServiceResult {
  const state = getState();
  let approved = 0;
  let skipped = 0;

  for (const id of applicationIds) {
    const app = state.applications.find((a) => a.id === id);
    if (!app || app.status !== "Pending") {
      skipped++;
      continue;
    }
    const company = state.companies.find((c) => c.id === app.companyId);
    if (company && company.status !== "Approved") {
      skipped++;
      continue;
    }
    updateApplication(id, { status: "Approved" });
    approved++;
  }

  addAuditLog({
    id: `al-${Date.now()}`,
    user: approvedBy,
    action: "Bulk Approved Applications",
    target: `${approved} applications`,
    timestamp: new Date().toISOString(),
    details: `${approved} approved, ${skipped} skipped (not eligible)`,
  });

  return {
    success: true,
    message: `${approved} application(s) approved. ${skipped} skipped.`,
  };
}

/**
 * Assign an academic supervisor to a student after company acceptance.
 */
export function assignSupervisor(
  applicationId: string,
  supervisorName: string,
  assignedBy: string
): ServiceResult {
  const state = getState();
  const app = state.applications.find((a) => a.id === applicationId);

  if (!app) return { success: false, message: "Application not found." };

  if (app.status !== "Company Accepted") {
    return {
      success: false,
      message: `Cannot assign supervisor: application status is "${app.status}". Must be "Company Accepted".`,
    };
  }

  updateApplication(applicationId, {
    status: "Active",
    supervisorAssigned: supervisorName,
  });

  addAuditLog({
    id: `al-${Date.now()}`,
    user: assignedBy,
    action: "Assigned Supervisor",
    target: `${app.studentName} → ${supervisorName}`,
    timestamp: new Date().toISOString(),
    details: "Academic supervisor assigned. Internship profile now active.",
  });

  addNotification({
    id: `n-${Date.now()}`,
    type: "application",
    title: "Supervisor Assigned",
    message: `${supervisorName} assigned to ${app.studentName}. Internship is now active.`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `${supervisorName} assigned to ${app.studentName}. Status updated to Active.`,
  };
}

/**
 * Get applications filtered by department (for DLO view).
 */
export function getApplicationsByDepartment(
  department: string
): Application[] {
  return getState().applications.filter((a) => a.department === department);
}

/**
 * Get pending applications count.
 */
export function getPendingApplicationsCount(department?: string): number {
  return getState().applications.filter(
    (a) =>
      a.status === "Pending" && (!department || a.department === department)
  ).length;
}
