// Compatibility shim — delegates to grading-service.
// Letter grades have been removed (Q7); helpers here return safe fallbacks.

import {
  approveCompiledGrade,
  requestGradeRevision as requestGradeRevisionV2,
  getDepartmentAveragePercent,
} from "./grading-service";
import type { GradingActor } from "../types/grading";

export interface ServiceResult {
  success: boolean;
  message: string;
}

export function getGradePoint(_letterGrade: string): number {
  // Letter grades dropped — return 0 to avoid breaking legacy callers.
  return 0;
}

export function approveGrade(applicationId: string, approvedBy: string): ServiceResult {
  const actor: GradingActor = { id: "compat", name: approvedBy, role: "dlo" };
  return approveCompiledGrade(applicationId, actor);
}

export function requestGradeRevision(
  applicationId: string,
  requestedBy: string,
  reason: string
): ServiceResult {
  const actor: GradingActor = { id: "compat", name: requestedBy, role: "dlo" };
  return requestGradeRevisionV2(applicationId, reason, actor);
}

export function getDepartmentAverageGrade(department: string): string {
  const pct = getDepartmentAveragePercent(department);
  return pct === null ? "N/A" : `${pct.toFixed(1)}%`;
}
