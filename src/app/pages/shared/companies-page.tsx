import { exportToCSV } from "../../lib/csv-export";
import type { ExtendedRole } from "../../services/auth-service";
import { useAppContext } from "../../lib/context";
import { ghanaRegions } from "../../lib/mock-data";
import {
  approveCompany, rejectCompany, overrideCompanyDecision,
  searchCompanies, findCompanyByName, getBranchesForCompany,
  createCompanyWithBranch, createCompanyOnly, createBranch, approveBranch, rejectBranch,
} from "../../services/company-service";
import {
  Search, CheckCircle2, XCircle, Building2, MapPin, Mail, Plus, X,
  User, Calendar, Download, ChevronDown, ChevronUp, AlertTriangle, Phone,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/status-badge";
import type { Company, Branch } from "../../lib/mock-data";

interface Props {
  viewRole: ExtendedRole;
}

const blankBranch = { name: "", region: ghanaRegions[6], location: "", address: "", telephone: "" };

export function CompaniesPage({ viewRole }: Props) {
  const { user, store } = useAppContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ kind: "company" | "branch"; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [addBranchFor, setAddBranchFor] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  const [companyForm, setCompanyForm] = useState({
    name: "", contactPerson: "", contactEmail: "", industry: "",
    branch: { ...blankBranch },
  });
  const [includeBranch, setIncludeBranch] = useState(false);
  // Search-first state for the Add Company modal
  const [companyNameQuery, setCompanyNameQuery] = useState("");
  const [committedNew, setCommittedNew] = useState(false);
  const [branchForm, setBranchForm] = useState({ ...blankBranch });

  const industries = [...new Set(store.companies.map((c) => c.industry).filter(Boolean) as string[])].sort();

  const filtered = store.companies.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchIndustry = industryFilter === "All" || c.industry === industryFilter;
    return matchSearch && matchStatus && matchIndustry;
  });

  const detail = selected ? store.companies.find((c) => c.id === selected) : null;
  const detailBranches = detail ? getBranchesForCompany(detail.id) : [];

  const approved = store.companies.filter((c) => c.status === "Approved").length;
  const pending = store.companies.filter((c) => c.status === "Pending").length;
  const pendingBranches = store.branches.filter((b) => b.status === "Pending").length;
  const rejected = store.companies.filter((c) => c.status === "Rejected").length;
  const total = store.companies.length;

  const handleApproveCompany = (id: string) => {
    const r = approveCompany(id, user?.name || "System");
    r.success ? toast.success(r.message) : toast.error(r.message);
  };

  const handleRejectSubmit = () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    const r =
      rejectModal.kind === "company"
        ? rejectCompany(rejectModal.id, user?.name || "System", rejectReason)
        : rejectBranch(rejectModal.id, user?.name || "System", rejectReason);
    if (r.success) {
      toast.success(r.message);
      setRejectModal(null);
      setRejectReason("");
    } else toast.error(r.message);
  };

  const handleOverride = (id: string, newStatus: "Approved" | "Rejected") => {
    const r = overrideCompanyDecision(id, newStatus, user?.name || "System", "CLO Override");
    r.success ? toast.success(r.message) : toast.error(r.message);
  };

  const handleAddCompany = () => {
    const companyInput = {
      name: companyForm.name,
      contactPerson: companyForm.contactPerson,
      contactEmail: companyForm.contactEmail,
      industry: companyForm.industry,
      addedBy: user?.name || "Admin",
      autoApprove: true,
    };
    const r = includeBranch
      ? createCompanyWithBranch(companyInput, { ...companyForm.branch, addedBy: user?.name || "Admin", autoApprove: true })
      : createCompanyOnly(companyInput);
    if (r.success) {
      toast.success(r.message);
      closeAddCompany();
    } else toast.error(r.message);
  };

  const closeAddCompany = () => {
    setShowAddCompany(false);
    setCompanyForm({ name: "", contactPerson: "", contactEmail: "", industry: "", branch: { ...blankBranch } });
    setIncludeBranch(false);
    setCompanyNameQuery("");
    setCommittedNew(false);
  };

  // When user clicks a duplicate suggestion → close Add Company, open Add Branch for that company.
  const pivotToAddBranch = (companyId: string) => {
    closeAddCompany();
    setBranchForm({ ...blankBranch });
    setAddBranchFor(companyId);
  };

  const handleAddBranchSubmit = () => {
    if (!addBranchFor) return;
    const r = createBranch({
      companyId: addBranchFor,
      ...branchForm,
      addedBy: user?.name || "Admin",
      autoApprove: true,
    });
    if (r.success) {
      toast.success(r.message);
      setAddBranchFor(null);
      setBranchForm({ ...blankBranch });
    } else toast.error(r.message);
  };

  const handleApproveBranch = (id: string) => {
    const r = approveBranch(id, user?.name || "System");
    r.success ? toast.success(r.message) : toast.error(r.message);
  };

  const toggleBranches = (companyId: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      next.has(companyId) ? next.delete(companyId) : next.add(companyId);
      return next;
    });
  };

  const getStudentCount = (companyId: string) =>
    store.applications.filter((a) => a.companyId === companyId && ["Active", "Completed"].includes(a.status)).length;

  // Live duplicate check while typing in Add Company form (used after commit-to-new)
  const dupCompany = useMemo(
    () => (companyForm.name.trim() ? findCompanyByName(companyForm.name) : undefined),
    [companyForm.name, store.companies],
  );
  // Live search results in the Add Company modal (search-first pattern)
  const companyNameMatches = useMemo(
    () => searchCompanies(companyNameQuery, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyNameQuery, store.companies],
  );
  const exactNameMatch = useMemo(
    () => (companyNameQuery.trim() ? findCompanyByName(companyNameQuery) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyNameQuery, store.companies],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Company Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Companies and branches · {total} companies · {store.branches.length} branches
            {pendingBranches > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "0.7rem" }}>
                {pendingBranches} branch{pendingBranches > 1 ? "es" : ""} pending
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportToCSV(
                filtered.flatMap((c) => {
                  const bs = getBranchesForCompany(c.id);
                  return bs.length > 0
                    ? bs.map((b) => ({
                        Company: c.name, Branch: b.name, Region: b.region, Location: b.location, Address: b.address,
                        Telephone: b.telephone, BranchStatus: b.status, CompanyStatus: c.status,
                        Contact: c.contactPerson, Email: c.contactEmail,
                      }))
                    : [{ Company: c.name, Branch: "—", Region: "", Location: "", Address: "", Telephone: "", BranchStatus: "", CompanyStatus: c.status, Contact: c.contactPerson, Email: c.contactEmail }];
                }),
                "companies_branches",
              );
            }}
            className="px-3 md:px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddCompany(true)}
            className="px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Company</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Companies", value: total, color: "text-blue-600 bg-blue-50", icon: Building2 },
          { label: "Approved", value: approved, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
          { label: "Pending", value: pending, color: "text-amber-600 bg-amber-50", icon: Calendar },
          { label: "Rejected", value: rejected, color: "text-red-600 bg-red-50", icon: XCircle },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{s.label}</p>
              <p style={{ fontSize: "1.25rem" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies, contacts, or industries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "Approved", "Pending", "Rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-accent"}`}
              style={{ fontSize: "0.8rem" }}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card"
          style={{ fontSize: "0.85rem" }}
        >
          <option value="All">All Industries</option>
          {industries.map((ind) => <option key={ind}>{ind}</option>)}
        </select>
      </div>

      {/* Company list with expandable branch rows */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const bs = getBranchesForCompany(c.id);
          const expanded = expandedBranches.has(c.id);
          const studentCount = getStudentCount(c.id);
          const pendingBs = bs.filter((b) => b.status === "Pending").length;

          return (
            <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelected(c.id)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontSize: "0.95rem" }} className="truncate">{c.name}</p>
                      <StatusBadge status={c.status} />
                      {pendingBs > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "0.65rem" }}>
                          {pendingBs} branch{pendingBs > 1 ? "es" : ""} pending
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>
                      {c.industry} · {c.contactPerson} · {c.contactEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-muted-foreground hidden sm:inline" style={{ fontSize: "0.75rem" }}>
                    {bs.length} branch{bs.length !== 1 ? "es" : ""}
                  </span>
                  {studentCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded" style={{ fontSize: "0.7rem" }}>
                      {studentCount} student{studentCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBranches(c.id); }}
                    className="p-1.5 rounded-md hover:bg-accent"
                    aria-label="Toggle branches"
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border bg-secondary/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Branches</p>
                    <button
                      onClick={() => { setAddBranchFor(c.id); setBranchForm({ ...blankBranch }); }}
                      className="px-2.5 py-1 border border-primary/30 text-primary rounded-lg hover:bg-primary/5 flex items-center gap-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Branch
                    </button>
                  </div>
                  {bs.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-center" style={{ fontSize: "0.8rem" }}>No branches yet.</p>
                  ) : (
                    bs.map((b) => (
                      <div key={b.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ fontSize: "0.85rem" }}>{b.name}</p>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-muted-foreground truncate" style={{ fontSize: "0.7rem" }}>
                            {b.region} · {b.location} · {b.address} · {b.telephone}
                          </p>
                          {b.rejectionReason && (
                            <p className="text-red-600 mt-1" style={{ fontSize: "0.7rem" }}>Reason: {b.rejectionReason}</p>
                          )}
                        </div>
                        {b.status === "Pending" && (
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleApproveBranch(b.id)}
                              className="px-2.5 py-1 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ kind: "branch", id: b.id })}
                              className="px-2.5 py-1 border border-destructive text-destructive rounded-md hover:bg-red-50 flex items-center gap-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {c.status === "Pending" && (
                <div className="border-t border-border p-3 flex gap-2 bg-amber-50/50">
                  <button
                    onClick={() => handleApproveCompany(c.id)}
                    className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center justify-center gap-1"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Company
                  </button>
                  <button
                    onClick={() => setRejectModal({ kind: "company", id: c.id })}
                    className="flex-1 py-1.5 border border-destructive text-destructive rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Company
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3>No companies found</h3>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
              Adjust your filters or add a new company.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3>Company Details</h3>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p style={{ fontSize: "0.95rem" }}>{detail.name}</p>
                  <StatusBadge status={detail.status} />
                </div>
              </div>

              {(
                [
                  ["Industry", detail.industry],
                  ["Contact Person", detail.contactPerson],
                  ["Email", detail.contactEmail],
                  ["Added By", detail.addedBy],
                  ["Date Added", detail.dateAdded],
                ] as [string, string | undefined][]
              ).map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{l}</p>
                  <p style={{ fontSize: "0.85rem" }}>{v || "—"}</p>
                </div>
              ))}

              {/* Branches */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.7rem" }}>
                    Branches ({detailBranches.length})
                  </p>
                  <button
                    onClick={() => { setAddBranchFor(detail.id); setBranchForm({ ...blankBranch }); }}
                    className="px-2 py-0.5 text-primary hover:underline flex items-center gap-1"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {detailBranches.length === 0 && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>No branches.</p>
                  )}
                  {detailBranches.map((b) => (
                    <div key={b.id} className="p-2.5 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p style={{ fontSize: "0.8rem" }}>{b.name}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.7rem" }}>
                        {b.region} · {b.location} · {b.telephone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {detail.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p style={{ fontSize: "0.7rem" }} className="text-red-600">REJECTION REASON</p>
                  <p style={{ fontSize: "0.85rem" }} className="text-red-800">{detail.rejectionReason}</p>
                </div>
              )}

              {viewRole === "clo" && detail.status !== "Pending" && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground">CLO OVERRIDE</p>
                  {detail.status === "Rejected" && (
                    <button onClick={() => handleOverride(detail.id, "Approved")} className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
                      Override → Approve
                    </button>
                  )}
                  {detail.status === "Approved" && (
                    <button onClick={() => handleOverride(detail.id, "Rejected")} className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
                      Override → Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal (company or branch) */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3>Reject {rejectModal.kind === "company" ? "Company" : "Branch"}</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection (required)..."
              className="w-full border border-border rounded-lg p-3 bg-background min-h-[100px]"
              style={{ fontSize: "0.85rem" }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleRejectSubmit} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company + first Branch Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeAddCompany}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Add New Company</h2>
              <button onClick={closeAddCompany} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              Search by name first — if the company already exists, add a branch to it instead.
            </p>

            {/* SEARCH-FIRST company name */}
            <div className="space-y-2">
              <label style={{ fontSize: "0.8rem" }}>Company Name *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={companyNameQuery}
                  onChange={(e) => {
                    setCompanyNameQuery(e.target.value);
                    setCommittedNew(false);
                    setCompanyForm({ ...companyForm, name: e.target.value });
                  }}
                  placeholder="Start typing… e.g., MTN Ghana"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              {/* Suggestions / no-match — only before user commits to "Register new" */}
              {companyNameQuery.trim() && !committedNew && (
                <div className="space-y-2">
                  {companyNameMatches.length > 0 ? (
                    <>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                        {companyNameMatches.length} match{companyNameMatches.length === 1 ? "" : "es"} — click to add a branch instead.
                      </p>
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {companyNameMatches.map(({ company: c }) => {
                          const branchCount = getBranchesForCompany(c.id).length;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => pivotToAddBranch(c.id)}
                              className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-start justify-between gap-2"
                            >
                              <div>
                                <p style={{ fontSize: "0.85rem" }}>{c.name}</p>
                                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                                  {branchCount} branch{branchCount === 1 ? "" : "es"} · {c.contactEmail}
                                </p>
                              </div>
                              <StatusBadge status={c.status} />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic" style={{ fontSize: "0.75rem" }}>
                      No matches found.
                    </p>
                  )}

                  {exactNameMatch ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-800" style={{ fontSize: "0.75rem" }}>
                        <strong>"{exactNameMatch.name}"</strong> already exists — please add a branch to it.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCommittedNew(true)}
                      className="w-full p-2.5 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary flex items-center justify-center gap-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <Plus className="w-4 h-4" /> Register "{companyNameQuery}" as a new company
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rest of company form — only after commit */}
            {committedNew && !exactNameMatch && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Company Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: "0.8rem" }}>Email *</label>
                    <input type="email" value={companyForm.contactEmail} onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                      placeholder="info@company.com" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem" }}>Contact Person *</label>
                    <input type="text" value={companyForm.contactPerson} onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                      placeholder="Full name" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <div className="md:col-span-2">
                    <label style={{ fontSize: "0.8rem" }}>Industry</label>
                    <input type="text" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                      placeholder="e.g., Telecommunications" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                  </div>
                </div>
              </div>
            )}

            {committedNew && !exactNameMatch && (
              <div className="space-y-3 border-t border-border pt-4">
                {!includeBranch ? (
                  <button
                    type="button"
                    onClick={() => setIncludeBranch(true)}
                    className="w-full p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <Plus className="w-4 h-4" /> Add First Branch (optional)
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>First Branch</p>
                      <button
                        type="button"
                        onClick={() => { setIncludeBranch(false); setCompanyForm({ ...companyForm, branch: { ...blankBranch } }); }}
                        className="text-muted-foreground hover:text-foreground"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Remove
                      </button>
                    </div>
                    <BranchFields value={companyForm.branch} onChange={(b) => setCompanyForm({ ...companyForm, branch: b })} />
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={closeAddCompany} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button
                onClick={handleAddCompany}
                disabled={!committedNew || !!dupCompany || !!exactNameMatch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                <Plus className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {addBranchFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAddBranchFor(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Add Branch</h2>
              <button onClick={() => setAddBranchFor(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              Adding a branch to <strong>{store.companies.find((c) => c.id === addBranchFor)?.name}</strong>.
            </p>
            <BranchFields value={branchForm} onChange={setBranchForm} />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setAddBranchFor(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleAddBranchSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2" style={{ fontSize: "0.85rem" }}>
                <Plus className="w-4 h-4" /> Add Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BranchFields({
  value,
  onChange,
}: {
  value: { name: string; region: string; location: string; address: string; telephone: string };
  onChange: (v: typeof value) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label style={{ fontSize: "0.8rem" }}>Branch Name *</label>
        <input type="text" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="e.g., Accra Branch" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
      </div>
      <div>
        <label style={{ fontSize: "0.8rem" }}>Region *</label>
        <select value={value.region} onChange={(e) => onChange({ ...value, region: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
          {ghanaRegions.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "0.8rem" }}>Location (City/Town) *</label>
        <input type="text" value={value.location} onChange={(e) => onChange({ ...value, location: e.target.value })}
          placeholder="e.g., Accra" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
      </div>
      <div className="md:col-span-2">
        <label style={{ fontSize: "0.8rem" }}>Address *</label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="Street address" className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
        </div>
      </div>
      <div className="md:col-span-2">
        <label style={{ fontSize: "0.8rem" }}>Telephone Number 1 *</label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="tel" value={value.telephone} onChange={(e) => onChange({ ...value, telephone: e.target.value })}
            placeholder="+233..." className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
        </div>
      </div>
    </div>
  );
}
