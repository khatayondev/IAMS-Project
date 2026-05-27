import { exportToCSV } from "../../lib/csv-export";
import type { ExtendedRole } from "../../services/auth-service";
import { useAppContext } from "../../lib/context";
import { ghanaRegions } from "../../lib/mock-data";
import {
  Search, CheckCircle2, XCircle, Building2, MapPin, Plus, X,
  Calendar, Download, ChevronDown, ChevronUp, AlertTriangle, Phone,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/status-badge";
import { apiClient } from "../../lib/api-client";

interface Props {
  viewRole: ExtendedRole;
}

const blankBranch = { name: "", region: ghanaRegions[6], location: "", address: "", telephone: "" };

export function CompaniesPage({ viewRole }: Props) {
  const { user } = useAppContext();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [committedNew, setCommittedNew] = useState(false);
  const [companyNameQuery, setCompanyNameQuery] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [companyForm, setCompanyForm] = useState({
    name: "", contactPerson: "", contactEmail: "", industry: "", phone: "", address: "", city: "", region: ghanaRegions[0], country: "Ghana",
  });
  const [branchForm, setBranchForm] = useState({ ...blankBranch });
  const [addBranchFor, setAddBranchFor] = useState<string | null>(null);
  const [includeBranch, setIncludeBranch] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.getCompanies();
    if (res.success) setCompanies(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const industries = useMemo(
    () => [...new Set(companies.map((c: any) => c.industry).filter(Boolean) as string[])].sort(),
    [companies]
  );

  const filtered = useMemo(() => companies.filter((c: any) => {
    const matchSearch = !search ||
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_person_name ?? c.contactPerson ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(search.toLowerCase());
    const status = c.approval_status ?? c.status ?? "";
    const matchStatus = statusFilter === "All" || status === statusFilter;
    const matchIndustry = industryFilter === "All" || c.industry === industryFilter;
    return matchSearch && matchStatus && matchIndustry;
  }), [companies, search, statusFilter, industryFilter]);

  const approved = companies.filter((c: any) => (c.approval_status ?? c.status) === "approved").length;
  const pending = companies.filter((c: any) => (c.approval_status ?? c.status) === "pending").length;
  const rejected = companies.filter((c: any) => (c.approval_status ?? c.status) === "rejected").length;

  // Local inline helpers (previously in company-service.ts)
  const searchCompanies = (query: string, limit = 6) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return companies.filter((c: any) => (c.name ?? "").toLowerCase().includes(q)).slice(0, limit).map((c: any) => ({ company: c }));
  };
  const findCompanyByName = (name: string) =>
    companies.find((c: any) => (c.name ?? "").toLowerCase() === name.toLowerCase());

  const handleApproveCompany = async (id: string) => {
    const r = await apiClient.approveCompany(id);
    if (r.success) { toast.success(r.message ?? "Company approved."); fetchCompanies(); }
    else toast.error(r.message ?? "Failed.");
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { toast.error("Please provide a rejection reason."); return; }
    const r = await apiClient.rejectCompany(rejectModal.id, rejectReason);
    if (r.success) {
      toast.success(r.message ?? "Company rejected.");
      setRejectModal(null); setRejectReason(""); fetchCompanies();
    } else toast.error(r.message ?? "Failed.");
  };

  const handleAddCompany = async () => {
    const payload: Record<string, unknown> = {
      name: companyForm.name,
      email: companyForm.contactEmail,
      phone: companyForm.phone,
      address: companyForm.address,
      city: companyForm.city,
      region: companyForm.region,
      country: companyForm.country,
      contact_person_name: companyForm.contactPerson,
      contact_person_email: companyForm.contactEmail,
      industry: companyForm.industry || undefined,
    };
    const r = await apiClient.createCompany(payload);
    if (r.success) {
      toast.success(r.message ?? "Company submitted for approval.");
      closeAddCompany(); fetchCompanies();
    } else toast.error(r.message ?? "Failed to create company.");
  };

  const closeAddCompany = () => {
    setShowAddCompany(false);
    setCompanyForm({ name: "", contactPerson: "", contactEmail: "", industry: "", phone: "", address: "", city: "", region: ghanaRegions[0], country: "Ghana" });
    setIncludeBranch(false); setCompanyNameQuery(""); setCommittedNew(false);
  };

  const pivotToAddBranch = (companyId: string) => { closeAddCompany(); setBranchForm({ ...blankBranch }); setAddBranchFor(companyId); };

  const toggleBranches = (companyId: string) => {
    setExpandedBranches((prev) => { const next = new Set(prev); next.has(companyId) ? next.delete(companyId) : next.add(companyId); return next; });
  };

  const companyNameMatches = useMemo(() => searchCompanies(companyNameQuery), [companyNameQuery, companies]);
  const exactNameMatch = useMemo(() => companyNameQuery.trim() ? findCompanyByName(companyNameQuery) : undefined, [companyNameQuery, companies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Company Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Companies · {companies.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(filtered.map((c: any) => ({
              Company: c.name, Industry: c.industry ?? "", Contact: c.contact_person_name ?? c.contactPerson ?? "", Email: c.email ?? c.contactEmail ?? "", Status: c.approval_status ?? c.status ?? "",
            })), "companies_export")}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: companies.length, color: "text-blue-600 bg-blue-50", icon: Building2 },
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

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card" style={{ fontSize: "0.85rem" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "approved", "pending", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-accent"}`}
              style={{ fontSize: "0.8rem" }}>
              {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card" style={{ fontSize: "0.85rem" }}>
          <option value="All">All Industries</option>
          {industries.map((ind) => <option key={ind}>{ind}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>Loading companies…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3>No companies found</h3>
          </div>
        ) : filtered.map((c: any) => {
          const companyId = String(c.id);
          const expanded = expandedBranches.has(companyId);
          const approvalStatus = c.approval_status ?? c.status ?? "";
          return (
            <div key={companyId} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelected(c)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontSize: "0.95rem" }} className="truncate">{c.name}</p>
                      <StatusBadge status={approvalStatus} />
                    </div>
                    <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>
                      {c.industry} · {c.contact_person_name ?? c.contactPerson ?? ""} · {c.email ?? c.contactEmail ?? ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); toggleBranches(companyId); }}
                    className="p-1.5 rounded-md hover:bg-accent" aria-label="Toggle branches">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {approvalStatus === "pending" && (
                <div className="border-t border-border p-3 flex gap-2 bg-amber-50/50">
                  <button onClick={() => handleApproveCompany(companyId)}
                    className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center justify-center gap-1"
                    style={{ fontSize: "0.8rem" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setRejectModal({ id: companyId })}
                    className="flex-1 py-1.5 border border-destructive text-destructive rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                    style={{ fontSize: "0.8rem" }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3>Company Details</h3>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p style={{ fontSize: "0.95rem" }}>{selected.name}</p>
                  <StatusBadge status={selected.approval_status ?? selected.status ?? ""} />
                </div>
              </div>
              {([
                ["Industry", selected.industry],
                ["Contact Person", selected.contact_person_name ?? selected.contactPerson],
                ["Email", selected.email ?? selected.contactEmail],
                ["Phone", selected.phone ?? selected.contactPhone],
                ["Address", selected.address],
                ["City", selected.city],
                ["Region", selected.region],
                ["Website", selected.website],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{l}</p>
                  <p style={{ fontSize: "0.85rem" }}>{v}</p>
                </div>
              ))}
              {selected.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p style={{ fontSize: "0.7rem" }} className="text-red-600">REJECTION REASON</p>
                  <p style={{ fontSize: "0.85rem" }} className="text-red-800">{selected.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3>Reject Company</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection (required)..."
              className="w-full border border-border rounded-lg p-3 bg-background min-h-[100px]"
              style={{ fontSize: "0.85rem" }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleRejectSubmit} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeAddCompany}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Add New Company</h2>
              <button onClick={closeAddCompany} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              Search by name first — if the company already exists, add a branch instead.
            </p>

            <div className="space-y-2">
              <label style={{ fontSize: "0.8rem" }}>Company Name *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={companyNameQuery}
                  onChange={(e) => { setCompanyNameQuery(e.target.value); setCommittedNew(false); setCompanyForm({ ...companyForm, name: e.target.value }); }}
                  placeholder="Start typing… e.g., MTN Ghana"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
              </div>

              {companyNameQuery.trim() && !committedNew && (
                <div className="space-y-2">
                  {companyNameMatches.length > 0 ? (
                    <>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{companyNameMatches.length} match{companyNameMatches.length === 1 ? "" : "es"} found.</p>
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {companyNameMatches.map(({ company: c }: { company: any }) => (
                          <button key={c.id} type="button" onClick={() => pivotToAddBranch(String(c.id))}
                            className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-start justify-between gap-2">
                            <div>
                              <p style={{ fontSize: "0.85rem" }}>{c.name}</p>
                              <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{c.email ?? c.contactEmail}</p>
                            </div>
                            <StatusBadge status={c.approval_status ?? c.status ?? ""} />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic" style={{ fontSize: "0.75rem" }}>No matches found.</p>
                  )}
                  {exactNameMatch ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-800" style={{ fontSize: "0.75rem" }}>
                        <strong>"{exactNameMatch.name}"</strong> already exists.
                      </p>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setCommittedNew(true)}
                      className="w-full p-2.5 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary flex items-center justify-center gap-2"
                      style={{ fontSize: "0.85rem" }}>
                      <Plus className="w-4 h-4" /> Register "{companyNameQuery}" as a new company
                    </button>
                  )}
                </div>
              )}
            </div>

            {committedNew && !exactNameMatch && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Company Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    ["Email *", "email", "contactEmail", "info@company.com", "email"],
                    ["Phone *", "phone", "phone", "+233...", "tel"],
                    ["Contact Person", "contactPerson", "contact_person_name", "Full name", "text"],
                    ["Industry", "industry", "industry", "e.g., Telecommunications", "text"],
                    ["Address *", "address", "address", "Street address", "text"],
                    ["City *", "city", "city", "e.g., Accra", "text"],
                  ] as [string, keyof typeof companyForm, string, string, string][]).map(([label, field, , placeholder, type]) => (
                    <div key={field} className={label.includes("Address") ? "md:col-span-2" : ""}>
                      <label style={{ fontSize: "0.8rem" }}>{label}</label>
                      <input type={type} value={(companyForm as any)[field]} onChange={(e) => setCompanyForm({ ...companyForm, [field]: e.target.value })}
                        placeholder={placeholder} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: "0.8rem" }}>Region *</label>
                    <select value={companyForm.region} onChange={(e) => setCompanyForm({ ...companyForm, region: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                      {ghanaRegions.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={closeAddCompany} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleAddCompany} disabled={!committedNew || !!exactNameMatch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}>
                <Plus className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
