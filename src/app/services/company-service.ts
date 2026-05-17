// Company approval and management business logic
// All company mutations go through this service

import { updateCompany, addAuditLog, addNotification, getState, addCompany, addBranch, updateBranch } from "../lib/store";
import type { Company, Branch } from "../lib/mock-data";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export interface CompanyMatch {
  company: Company;
  score: number; // exact=1, prefix=0.8, substring=0.5
}

/** Case-insensitive search over approved + pending companies. */
export function searchCompanies(query: string, limit = 8): CompanyMatch[] {
  const q = norm(query);
  if (!q) return [];
  const matches: CompanyMatch[] = [];
  for (const c of getState().companies) {
    const n = norm(c.name);
    let score = 0;
    if (n === q) score = 1;
    else if (n.startsWith(q)) score = 0.8;
    else if (n.includes(q)) score = 0.5;
    if (score > 0) matches.push({ company: c, score });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Returns the matching company if a same-name company already exists, else undefined. */
export function findCompanyByName(name: string): Company | undefined {
  const q = norm(name);
  if (!q) return undefined;
  return getState().companies.find((c) => norm(c.name) === q);
}

/** Branches under a given company. */
export function getBranchesForCompany(companyId: string): Branch[] {
  return getState().branches.filter((b) => b.companyId === companyId);
}

/** Case-insensitive branch dedup within the same company. */
export function findBranchByName(companyId: string, name: string): Branch | undefined {
  const q = norm(name);
  if (!q) return undefined;
  return getState().branches.find((b) => b.companyId === companyId && norm(b.name) === q);
}

export interface CreateCompanyInput {
  name: string;
  contactPerson: string;
  contactEmail: string;
  industry?: string;
  addedBy: string;
  // Auto-approve when CLO/DLO creates; pending when student creates.
  autoApprove?: boolean;
}

export interface CreateBranchInput {
  companyId: string;
  name: string;
  region: string;
  location: string;
  address: string;
  telephone: string;
  addedBy: string;
  autoApprove?: boolean;
}

export interface CreateResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

/** Create a company + first branch atomically with duplicate prevention. */
export function createCompanyWithBranch(
  company: CreateCompanyInput,
  branch: Omit<CreateBranchInput, "companyId">
): CreateResult<{ company: Company; branch: Branch }> {
  if (!company.name.trim()) return { success: false, message: "Company name is required." };
  if (!company.contactPerson.trim()) return { success: false, message: "Contact person is required." };
  if (!company.contactEmail.trim()) return { success: false, message: "Contact email is required." };
  if (!branch.name.trim()) return { success: false, message: "Branch name is required." };
  if (!branch.region.trim()) return { success: false, message: "Region is required." };
  if (!branch.location.trim()) return { success: false, message: "Location is required." };
  if (!branch.address.trim()) return { success: false, message: "Branch address is required." };
  if (!branch.telephone.trim()) return { success: false, message: "Telephone is required." };

  const existing = findCompanyByName(company.name);
  if (existing) {
    return {
      success: false,
      message: `"${existing.name}" already exists. Please select it from the suggestions and add a branch instead.`,
      data: undefined,
    };
  }

  const id = `c-${Date.now()}`;
  const status: Company["status"] = company.autoApprove ? "Approved" : "Pending";
  const today = new Date().toISOString().split("T")[0];

  const newCompany: Company = {
    id,
    name: company.name.trim(),
    contactPerson: company.contactPerson.trim(),
    contactEmail: company.contactEmail.trim(),
    industry: company.industry?.trim() || "Other",
    status,
    addedBy: company.addedBy,
    dateAdded: today,
    address: branch.address.trim(),
    contactPhone: branch.telephone.trim(),
  };
  addCompany(newCompany);

  const newBranch: Branch = {
    id: `b-${Date.now()}`,
    companyId: id,
    name: branch.name.trim(),
    region: branch.region,
    location: branch.location.trim(),
    address: branch.address.trim(),
    telephone: branch.telephone.trim(),
    status,
    addedBy: branch.addedBy,
    dateAdded: today,
  };
  addBranch(newBranch);

  addAuditLog({
    id: `al-${Date.now()}`,
    user: company.addedBy,
    action: "Added Company",
    target: newCompany.name,
    timestamp: new Date().toISOString(),
    details: `Created with branch "${newBranch.name}" (${status}).`,
  });

  return { success: true, message: `${newCompany.name} created (${status}).`, data: { company: newCompany, branch: newBranch } };
}

/** Create a company with no branches (admin-only path; branches can be added later). */
export function createCompanyOnly(
  input: CreateCompanyInput
): CreateResult<Company> {
  if (!input.name.trim()) return { success: false, message: "Company name is required." };
  if (!input.contactPerson.trim()) return { success: false, message: "Contact person is required." };
  if (!input.contactEmail.trim()) return { success: false, message: "Contact email is required." };

  const existing = findCompanyByName(input.name);
  if (existing) {
    return { success: false, message: `"${existing.name}" already exists.` };
  }

  const id = `c-${Date.now()}`;
  const status: Company["status"] = input.autoApprove ? "Approved" : "Pending";
  const today = new Date().toISOString().split("T")[0];

  const newCompany: Company = {
    id,
    name: input.name.trim(),
    contactPerson: input.contactPerson.trim(),
    contactEmail: input.contactEmail.trim(),
    industry: input.industry?.trim() || "Other",
    status,
    addedBy: input.addedBy,
    dateAdded: today,
  };
  addCompany(newCompany);

  addAuditLog({
    id: `al-${Date.now()}`,
    user: input.addedBy,
    action: "Added Company",
    target: newCompany.name,
    timestamp: new Date().toISOString(),
    details: `Created without branches (${status}).`,
  });

  return { success: true, message: `${newCompany.name} created (${status}).`, data: newCompany };
}

/** Add a branch to an existing company with duplicate prevention. */
export function createBranch(input: CreateBranchInput): CreateResult<Branch> {
  if (!input.name.trim()) return { success: false, message: "Branch name is required." };
  if (!input.region.trim()) return { success: false, message: "Region is required." };
  if (!input.location.trim()) return { success: false, message: "Location is required." };
  if (!input.address.trim()) return { success: false, message: "Address is required." };
  if (!input.telephone.trim()) return { success: false, message: "Telephone is required." };

  const company = getState().companies.find((c) => c.id === input.companyId);
  if (!company) return { success: false, message: "Company not found." };

  if (findBranchByName(input.companyId, input.name)) {
    return { success: false, message: `A branch named "${input.name.trim()}" already exists for ${company.name}.` };
  }

  const status: Branch["status"] = input.autoApprove ? "Approved" : "Pending";
  const branch: Branch = {
    id: `b-${Date.now()}`,
    companyId: input.companyId,
    name: input.name.trim(),
    region: input.region,
    location: input.location.trim(),
    address: input.address.trim(),
    telephone: input.telephone.trim(),
    status,
    addedBy: input.addedBy,
    dateAdded: new Date().toISOString().split("T")[0],
  };
  addBranch(branch);

  addAuditLog({
    id: `al-${Date.now()}`,
    user: input.addedBy,
    action: "Added Branch",
    target: `${company.name} → ${branch.name}`,
    timestamp: new Date().toISOString(),
    details: `Branch created with status ${status}.`,
  });

  return { success: true, message: `Branch added (${status}).`, data: branch };
}

export function approveBranch(branchId: string, approvedBy: string): CreateResult<Branch> {
  const branch = getState().branches.find((b) => b.id === branchId);
  if (!branch) return { success: false, message: "Branch not found." };
  if (branch.status === "Approved") return { success: false, message: "Branch is already approved." };
  updateBranch(branchId, { status: "Approved", rejectionReason: undefined });
  const company = getState().companies.find((c) => c.id === branch.companyId);
  addAuditLog({
    id: `al-${Date.now()}`,
    user: approvedBy,
    action: "Approved Branch",
    target: `${company?.name ?? "?"} → ${branch.name}`,
    timestamp: new Date().toISOString(),
    details: "Branch approved.",
  });
  return { success: true, message: `Branch "${branch.name}" approved.` };
}

export function rejectBranch(branchId: string, rejectedBy: string, reason: string): CreateResult<Branch> {
  if (!reason.trim()) return { success: false, message: "Rejection reason is required." };
  const branch = getState().branches.find((b) => b.id === branchId);
  if (!branch) return { success: false, message: "Branch not found." };
  updateBranch(branchId, { status: "Rejected", rejectionReason: reason });
  const company = getState().companies.find((c) => c.id === branch.companyId);
  addAuditLog({
    id: `al-${Date.now()}`,
    user: rejectedBy,
    action: "Rejected Branch",
    target: `${company?.name ?? "?"} → ${branch.name}`,
    timestamp: new Date().toISOString(),
    details: `Reason: ${reason}`,
  });
  return { success: true, message: `Branch "${branch.name}" rejected.` };
}

export interface ApproveCompanyResult {
  success: boolean;
  message: string;
}

/**
 * Approves a company — sets is_verified flag (status: "Approved").
 * Once approved, the company becomes available system-wide in the dropdown.
 */
export function approveCompany(
  companyId: string,
  approvedBy: string
): ApproveCompanyResult {
  const state = getState();
  const company = state.companies.find((c) => c.id === companyId);

  if (!company) {
    return { success: false, message: "Company not found." };
  }

  if (company.status === "Approved") {
    return { success: false, message: "Company is already approved." };
  }

  updateCompany(companyId, { status: "Approved" });

  addAuditLog({
    id: `al-${Date.now()}`,
    user: approvedBy,
    action: "Approved Company",
    target: company.name,
    timestamp: new Date().toISOString(),
    details: `Company verified and approved for system-wide access (is_verified = true)`,
  });

  addNotification({
    id: `n-${Date.now()}`,
    type: "company",
    title: "Company Approved",
    message: `${company.name} has been approved and is now available for all students.`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: `${company.name} approved successfully.` };
}

/**
 * Rejects a company with a mandatory reason.
 */
export function rejectCompany(
  companyId: string,
  rejectedBy: string,
  reason: string
): ApproveCompanyResult {
  const state = getState();
  const company = state.companies.find((c) => c.id === companyId);

  if (!company) {
    return { success: false, message: "Company not found." };
  }

  if (!reason.trim()) {
    return { success: false, message: "Rejection reason is required." };
  }

  updateCompany(companyId, { status: "Rejected", rejectionReason: reason });

  addAuditLog({
    id: `al-${Date.now()}`,
    user: rejectedBy,
    action: "Rejected Company",
    target: company.name,
    timestamp: new Date().toISOString(),
    details: `Reason: ${reason}`,
  });

  return { success: true, message: `${company.name} rejected.` };
}

/**
 * CLO override — can reverse a DLO's decision.
 */
export function overrideCompanyDecision(
  companyId: string,
  newStatus: "Approved" | "Rejected",
  overriddenBy: string,
  reason?: string
): ApproveCompanyResult {
  const state = getState();
  const company = state.companies.find((c) => c.id === companyId);

  if (!company) {
    return { success: false, message: "Company not found." };
  }

  const updates: Partial<Company> =
    newStatus === "Approved"
      ? { status: "Approved", rejectionReason: undefined }
      : { status: "Rejected", rejectionReason: reason || "Overridden by CLO" };

  updateCompany(companyId, updates);

  addAuditLog({
    id: `al-${Date.now()}`,
    user: overriddenBy,
    action: `Override: ${newStatus} Company`,
    target: company.name,
    timestamp: new Date().toISOString(),
    details: `CLO override from ${company.status} to ${newStatus}. ${reason || ""}`,
  });

  return {
    success: true,
    message: `${company.name} overridden to ${newStatus}.`,
  };
}

/**
 * Get companies filtered by department (for DLO).
 */
export function getCompaniesByDepartment(department: string): Company[] {
  return getState().companies.filter((c) => c.department === department);
}

/**
 * Get all pending companies.
 */
export function getPendingCompanies(department?: string): Company[] {
  const state = getState();
  return state.companies.filter(
    (c) =>
      c.status === "Pending" && (!department || c.department === department)
  );
}
