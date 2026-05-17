import { useMemo, useState } from "react";
import { useAppContext } from "../../lib/context";
import {
  getEligibleStudents,
  getSupervisors,
  previewAutoAssign,
  applyAutoAssign,
  manualAssign,
  toggleAssignmentLock,
  clearAssignment,
  type AutoAssignPreview,
} from "../../services/assignment-service";
import {
  MapPin, Zap, Lock, Unlock, RefreshCw, Search, X, Users, AlertTriangle,
  CheckCircle2, ArrowRight, Building2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/status-badge";

type StatusFilter = "all" | "assigned" | "unassigned" | "locked";

export function DLOAssignmentsPage() {
  const { user, store } = useAppContext();
  const department = user?.department || "";

  const [activeTab, setActiveTab] = useState<"students" | "load" | "clusters">("students");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [supervisorFilter, setSupervisorFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [preview, setPreview] = useState<AutoAssignPreview | null>(null);
  const [reassignFor, setReassignFor] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  // Re-derive on every render (cheap; store is in-memory).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = store; // ensures re-render on store changes

  const allEligible = getEligibleStudents().filter((e) => !department || e.application.department === department);
  const supervisors = getSupervisors().filter((s) => !department || s.department === department);

  const regions = useMemo(
    () => Array.from(new Set(allEligible.map((e) => e.region).filter((r) => r && r !== "—"))).sort(),
    [allEligible]
  );

  const filtered = allEligible.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const hit =
        e.application.studentName.toLowerCase().includes(q) ||
        e.application.studentId.toLowerCase().includes(q) ||
        e.application.companyName.toLowerCase().includes(q) ||
        (e.branch?.name ?? "").toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (regionFilter !== "All" && e.region !== regionFilter) return false;
    if (supervisorFilter !== "All" && e.currentSupervisor !== supervisorFilter) return false;
    if (statusFilter === "assigned" && !e.currentSupervisor) return false;
    if (statusFilter === "unassigned" && !!e.currentSupervisor) return false;
    if (statusFilter === "locked" && !e.locked) return false;
    return true;
  });

  // Stats
  const total = allEligible.length;
  const assigned = allEligible.filter((e) => !!e.currentSupervisor).length;
  const unassigned = total - assigned;
  const locked = allEligible.filter((e) => e.locked).length;

  // Region clusters (region → supervisor → count)
  const clusters = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const e of allEligible) {
      if (!e.currentSupervisor) continue;
      const inner = map.get(e.region) ?? new Map();
      inner.set(e.currentSupervisor, (inner.get(e.currentSupervisor) ?? 0) + 1);
      map.set(e.region, inner);
    }
    return Array.from(map.entries())
      .map(([region, inner]) => ({
        region,
        rows: Array.from(inner.entries()).map(([supervisor, count]) => ({ supervisor, count })),
      }))
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [allEligible]);

  // Live load per supervisor (counts current eligible-student assignments only)
  const liveLoad = useMemo(() => {
    const m: Record<string, number> = {};
    supervisors.forEach((s) => (m[s.name] = 0));
    allEligible.forEach((e) => {
      if (e.currentSupervisor && m[e.currentSupervisor] !== undefined) m[e.currentSupervisor] += 1;
    });
    return m;
  }, [supervisors, allEligible]);

  const handlePreview = () => {
    const p = previewAutoAssign();
    // Restrict preview to current department
    const scoped: AutoAssignPreview = {
      proposed: p.proposed.filter((x) => !department || x.department === department),
      unassignable: p.unassignable.filter((u) =>
        allEligible.some((e) => e.application.id === u.applicationId)
      ),
      loadAfter: Object.fromEntries(
        Object.entries(p.loadAfter).filter(([, v]) => !department || v.supervisor.department === department)
      ),
    };
    if (scoped.proposed.length === 0 && scoped.unassignable.length === 0) {
      toast.info("Nothing to assign — all eligible students already have a supervisor.");
      return;
    }
    setPreview(scoped);
  };

  const handleApply = () => {
    if (!preview) return;
    const r = applyAutoAssign(preview, user?.name || "DLO");
    r.success ? toast.success(r.message) : toast.error(r.message);
    setPreview(null);
  };

  const handleReassign = () => {
    if (!reassignFor || !reassignTo) return;
    const r = manualAssign(reassignFor, reassignTo, user?.name || "DLO");
    if (r.success) {
      toast.success(r.message);
      setReassignFor(null);
      setReassignTo("");
    } else toast.error(r.message);
  };

  const handleClear = (appId: string) => {
    const r = clearAssignment(appId, user?.name || "DLO");
    r.success ? toast.success(r.message) : toast.error(r.message);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1>Assignments</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Match students to academic supervisors by branch region and load. {department && <>Department: <strong>{department}</strong></>}
          </p>
        </div>
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          style={{ fontSize: "0.85rem" }}
        >
          <Zap className="w-4 h-4" /> Run Auto-Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Eligible Students" value={total} icon={<Users className="w-4 h-4" />} tone="default" />
        <Stat label="Assigned" value={assigned} icon={<CheckCircle2 className="w-4 h-4" />} tone="emerald" />
        <Stat label="Unassigned" value={unassigned} icon={<AlertTriangle className="w-4 h-4" />} tone="amber" />
        <Stat label="Locked" value={locked} icon={<Lock className="w-4 h-4" />} tone="default" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "students" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
          style={{ fontSize: "0.85rem" }}
        >
          Student Assignments
        </button>
        <button
          onClick={() => setActiveTab("load")}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "load" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
          style={{ fontSize: "0.85rem" }}
        >
          Supervisor Load
        </button>
        <button
          onClick={() => setActiveTab("clusters")}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "clusters" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
          style={{ fontSize: "0.85rem" }}
        >
          Region Clusters
        </button>
      </div>

      {activeTab === "load" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3">Supervisor Load</h3>
          {supervisors.length === 0 ? (
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>No supervisors in this department.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supervisors.map((s) => {
                const load = liveLoad[s.name] ?? 0;
                const pct = Math.min(100, Math.round((load / s.maxLoad) * 100));
                const tone = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary";
                return (
                  <div key={s.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p style={{ fontSize: "0.85rem" }}>{s.name}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{load}/{s.maxLoad}</p>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "clusters" && clusters.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Region Clusters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clusters.map((c) => (
              <div key={c.region} className="border border-border rounded-lg p-3">
                <p style={{ fontSize: "0.85rem" }}>{c.region}</p>
                <div className="mt-2 space-y-1">
                  {c.rows.map((r) => (
                    <div key={r.supervisor} className="flex items-center justify-between" style={{ fontSize: "0.75rem" }}>
                      <span className="text-muted-foreground">{r.supervisor}</span>
                      <span className="px-1.5 py-0.5 bg-secondary rounded">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "clusters" && clusters.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          No region clusters available. Assignments might be pending.
        </div>
      )}

      {activeTab === "students" && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student, ID, company, branch..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
              <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                <option value="All">All regions</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={supervisorFilter} onChange={(e) => setSupervisorFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                <option value="All">All supervisors</option>
                {supervisors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                <option value="all">All</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>

          {/* Assignments table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    {["Student", "Company / Branch", "Region", "Supervisor", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontSize: "0.7rem" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                      No eligible students match your filters.
                    </td></tr>
                  ) : filtered.map((e) => {
                    const a = e.application;
                    return (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <p style={{ fontSize: "0.85rem" }}>{a.studentName}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{a.studentId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p style={{ fontSize: "0.8rem" }}>{a.companyName}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                            <Building2 className="inline w-3 h-3 mr-1" /> {a.branchName ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p style={{ fontSize: "0.8rem" }}>{e.region}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{e.location}</p>
                        </td>
                        <td className="px-4 py-3">
                          {e.currentSupervisor ? (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded" style={{ fontSize: "0.75rem" }}>
                              {e.currentSupervisor}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic" style={{ fontSize: "0.75rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setReassignFor(a.id); setReassignTo(e.currentSupervisor ?? ""); }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                              title="Reassign"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleAssignmentLock(a.id, !e.locked)}
                              className={`p-1.5 rounded hover:bg-accent ${e.locked ? "text-amber-600" : "text-muted-foreground"}`}
                              title={e.locked ? "Unlock" : "Lock"}
                            >
                              {e.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            {e.currentSupervisor && (
                              <button
                                onClick={() => handleClear(a.id)}
                                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-red-600"
                                title="Clear assignment"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Auto-Assignment Preview</h2>
              <button onClick={() => setPreview(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              Review proposed changes below. Nothing is saved until you click <strong>Apply</strong>.
            </p>

            {preview.proposed.length === 0 ? (
              <div className="bg-secondary/30 rounded-lg p-4 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                No changes proposed.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>
                  Proposed Assignments ({preview.proposed.length})
                </p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/30 border-b border-border">
                      <tr>
                        {["Student", "Region", "From → To"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-muted-foreground" style={{ fontSize: "0.7rem" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.proposed.map((p) => (
                        <tr key={p.applicationId} className="border-b border-border last:border-0">
                          <td className="px-3 py-2" style={{ fontSize: "0.8rem" }}>{p.studentName}</td>
                          <td className="px-3 py-2 text-muted-foreground" style={{ fontSize: "0.75rem" }}>{p.region}</td>
                          <td className="px-3 py-2" style={{ fontSize: "0.8rem" }}>
                            <span className="text-muted-foreground">{p.fromSupervisor ?? "—"}</span>
                            <ArrowRight className="inline w-3 h-3 mx-1.5 text-muted-foreground" />
                            <span className="text-primary">{p.toSupervisor}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preview.unassignable.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>
                  Unassignable ({preview.unassignable.length})
                </p>
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-1">
                  {preview.unassignable.map((u) => (
                    <p key={u.applicationId} className="text-amber-800" style={{ fontSize: "0.75rem" }}>
                      <strong>{u.studentName}:</strong> {u.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Load After Apply</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.values(preview.loadAfter).map(({ supervisor, before, after }) => {
                  const delta = after - before;
                  return (
                    <div key={supervisor.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                      <span style={{ fontSize: "0.8rem" }}>{supervisor.name}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                        {before} → <strong className="text-foreground">{after}</strong> / {supervisor.maxLoad}
                        {delta > 0 && <span className="ml-1 text-emerald-600">(+{delta})</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleApply} disabled={preview.proposed.length === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}>
                <CheckCircle2 className="w-4 h-4" /> Apply Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual reassign modal */}
      {reassignFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setReassignFor(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Reassign Supervisor</h2>
              <button onClick={() => setReassignFor(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            {(() => {
              const e = allEligible.find((x) => x.application.id === reassignFor);
              if (!e) return null;
              return (
                <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                  Student: <strong className="text-foreground">{e.application.studentName}</strong> · {e.region} · {e.location}
                </p>
              );
            })()}
            <div>
              <label style={{ fontSize: "0.8rem" }}>Supervisor</label>
              <div className="relative mt-1">
                <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                  <option value="">Select supervisor...</option>
                  {supervisors.map((s) => {
                    const load = liveLoad[s.name] ?? 0;
                    const full = load >= s.maxLoad;
                    return (
                      <option key={s.id} value={s.name} disabled={full}>
                        {s.name} — {load}/{s.maxLoad}{full ? " (full)" : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassignFor(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleReassign} disabled={!reassignTo}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: "0.85rem" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "default" | "emerald" | "amber" }) {
  const toneCls =
    tone === "emerald" ? "bg-emerald-50 text-emerald-700"
      : tone === "amber" ? "bg-amber-50 text-amber-700"
      : "bg-secondary/40 text-muted-foreground";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>{label}</p>
        <span className={`p-1.5 rounded ${toneCls}`}>{icon}</span>
      </div>
      <p className="mt-1" style={{ fontSize: "1.4rem" }}>{value}</p>
    </div>
  );
}
