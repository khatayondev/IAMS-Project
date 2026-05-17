import { useState } from "react";
import { StatusBadge } from "../../components/status-badge";
import { ProgramPicker } from "../../components/program-picker";
import { useAppContext } from "../../lib/context";
import { departments, programsByDepartment } from "../../lib/mock-data";
import { addTerm, updateTerm } from "../../lib/store";
import { Plus, Calendar, Archive, Eye, X, Play, Pause, Edit2, CheckCircle2, Clock, FileText, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type ViewMode = "cards" | "timeline";

export function TermsPage() {
  const { store } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", type: "Semestrial", applicationStart: "", applicationEnd: "",
    internshipStart: "", internshipEnd: "", levels: ["L300"], departments: departments,
    programs: [] as string[],
  });

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Term name is required.");
      return;
    }
    addTerm({
      id: `t-${Date.now()}`,
      name: form.name,
      type: form.type as "Semestrial" | "Vacation",
      status: "Upcoming",
      applicationStart: form.applicationStart,
      applicationEnd: form.applicationEnd,
      internshipStart: form.internshipStart,
      internshipEnd: form.internshipEnd,
      eligibleLevels: form.levels,
      departments: form.departments,
      programs: form.programs,
    });
    toast.success("Term created successfully.");
    setShowCreate(false);
    setForm({ name: "", type: "Semestrial", applicationStart: "", applicationEnd: "", internshipStart: "", internshipEnd: "", levels: ["L300"], departments, programs: [] });
  };

  const handleArchive = (id: string) => {
    updateTerm(id, { status: "Archived" });
    toast.success("Term archived. It is now read-only.");
  };

  const handleActivate = (id: string) => {
    // Deactivate any currently active term
    store.terms.forEach((t) => {
      if (t.status === "Active") updateTerm(t.id, { status: "Completed" });
    });
    updateTerm(id, { status: "Active" });
    toast.success("Term activated.");
  };

  const getTermStats = (termId: string) => {
    const term = store.terms.find((t) => t.id === termId);
    if (!term) return { total: 0, active: 0, pending: 0, completed: 0 };
    const apps = store.applications;
    return {
      total: apps.length,
      active: apps.filter((a) => a.status === "Active").length,
      pending: apps.filter((a) => a.status === "Pending").length,
      completed: apps.filter((a) => a.status === "Completed").length,
    };
  };

  const selectedTermData = selectedTerm ? store.terms.find((t) => t.id === selectedTerm) : null;
  const selectedStats = selectedTerm ? getTermStats(selectedTerm) : null;

  const sortedTerms = [...store.terms].sort((a, b) => {
    const order = { Active: 0, Upcoming: 1, Completed: 2, Archived: 3 };
    return (order[a.status] || 99) - (order[b.status] || 99);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Term Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Configure internship terms, periods, and eligibility · {store.terms.length} terms
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              style={{ fontSize: "0.8rem" }}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-2 ${viewMode === "timeline" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              style={{ fontSize: "0.8rem" }}
            >
              Timeline
            </button>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <Plus className="w-4 h-4" /> Create Term
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Terms", value: store.terms.filter((t) => t.status === "Active").length, icon: Play, color: "text-emerald-600 bg-emerald-50" },
          { label: "Upcoming", value: store.terms.filter((t) => t.status === "Upcoming").length, icon: Clock, color: "text-cyan-600 bg-cyan-50" },
          { label: "Completed", value: store.terms.filter((t) => t.status === "Completed").length, icon: CheckCircle2, color: "text-violet-600 bg-violet-50" },
          { label: "Archived", value: store.terms.filter((t) => t.status === "Archived").length, icon: Archive, color: "text-gray-600 bg-gray-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
              <p style={{ fontSize: "1.25rem" }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>Create New Term</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "0.8rem" }}>Term Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., 2026 L300 Semestrial Internship" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }}>
                <option>Semestrial</option>
                <option>Vacation</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Application Start</label>
              <input type="date" value={form.applicationStart} onChange={(e) => setForm({ ...form, applicationStart: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Application End</label>
              <input type="date" value={form.applicationEnd} onChange={(e) => setForm({ ...form, applicationEnd: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Internship Start</label>
              <input type="date" value={form.internshipStart} onChange={(e) => setForm({ ...form, internshipStart: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Internship End</label>
              <input type="date" value={form.internshipEnd} onChange={(e) => setForm({ ...form, internshipEnd: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
            </div>
          </div>
          <div className="space-y-4 border-t border-border pt-4">
            {/* Eligible Levels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label style={{ fontSize: "0.8rem" }}>Eligible Levels</label>
                <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                  {form.levels.length === 4 ? "All levels" : `${form.levels.length} selected`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setForm({ ...form, levels: form.levels.length === 4 ? [] : ["L100", "L200", "L300", "L400"] })}
                  className={`px-3 py-1.5 rounded-lg border ${form.levels.length === 4 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                  style={{ fontSize: "0.8rem" }}
                >
                  All
                </button>
                {["L100", "L200", "L300", "L400"].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      const levels = form.levels.includes(level)
                        ? form.levels.filter((l) => l !== level)
                        : [...form.levels, level];
                      setForm({ ...form, levels });
                    }}
                    className={`px-3 py-1.5 rounded-lg border ${form.levels.includes(level) && form.levels.length !== 4 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                    style={{ fontSize: "0.8rem" }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Eligible Departments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label style={{ fontSize: "0.8rem" }}>Eligible Departments</label>
                <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                  {form.departments.length === departments.length ? "All departments" : `${form.departments.length} selected`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const allSelected = form.departments.length === departments.length;
                    setForm({ ...form, departments: allSelected ? [] : departments, programs: allSelected ? [] : form.programs });
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${form.departments.length === departments.length ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                  style={{ fontSize: "0.8rem" }}
                >
                  All
                </button>
                {departments.map((d) => {
                  const selected = form.departments.includes(d);
                  const isAll = form.departments.length === departments.length;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        const next = selected
                          ? form.departments.filter((x) => x !== d)
                          : [...form.departments, d];
                        // Drop programs belonging to deselected departments
                        const allowed = new Set(next.flatMap((dep) => programsByDepartment[dep] || []));
                        setForm({ ...form, departments: next, programs: form.programs.filter((p) => allowed.has(p)) });
                      }}
                      className={`px-3 py-1.5 rounded-lg border ${selected && !isAll ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eligible Programs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label style={{ fontSize: "0.8rem" }}>Eligible Programs</label>
                <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                  {form.programs.length === 0 ? "All programs in selected departments" : `${form.programs.length} selected`}
                </span>
              </div>
              {form.departments.length === 0 ? (
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  Select at least one department to choose programs.
                </p>
              ) : (
                <ProgramPicker
                  selectedDepartments={form.departments}
                  selectedPrograms={form.programs}
                  onChange={(programs) => setForm({ ...form, programs })}
                />
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>Publish Term</button>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" ? (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3>Term Timeline</h3>
          <div className="space-y-3">
            {sortedTerms.map((t) => {
              const stats = getTermStats(t.id);
              return (
                <div
                  key={t.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTerm(t.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${t.status === "Active" ? "bg-emerald-500" : t.status === "Upcoming" ? "bg-cyan-500" : t.status === "Completed" ? "bg-violet-500" : "bg-gray-400"}`} />
                      <h4 style={{ fontSize: "0.9rem" }}>{t.name}</h4>
                      <StatusBadge status={t.status} />
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{t.type}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Application Period</p>
                      <p style={{ fontSize: "0.8rem" }}>{t.applicationStart} → {t.applicationEnd}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Internship Period</p>
                      <p style={{ fontSize: "0.8rem" }}>{t.internshipStart} → {t.internshipEnd}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Levels</p>
                      <p style={{ fontSize: "0.8rem" }}>{t.eligibleLevels.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Applications</p>
                      <p style={{ fontSize: "0.8rem" }}>{stats.total} total</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTerms.map((t) => {
            const stats = getTermStats(t.id);
            return (
              <div key={t.id} className="bg-card rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3>{t.name}</h3>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="space-y-2">
                  {([
                    ["Type", t.type],
                    ["Applications", `${t.applicationStart} → ${t.applicationEnd}`],
                    ["Internship", `${t.internshipStart} → ${t.internshipEnd}`],
                    ["Levels", t.eligibleLevels.join(", ")],
                    ["Departments", t.departments.length === departments.length ? "All" : t.departments.join(", ")],
                  ] as const).map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ fontSize: "0.75rem" }} className="text-muted-foreground">{l}</span>
                      <span style={{ fontSize: "0.75rem" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <p style={{ fontSize: "1rem" }} className="text-blue-600">{stats.active}</p>
                    <p style={{ fontSize: "0.65rem" }} className="text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: "1rem" }} className="text-amber-600">{stats.pending}</p>
                    <p style={{ fontSize: "0.65rem" }} className="text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: "1rem" }} className="text-violet-600">{stats.completed}</p>
                    <p style={{ fontSize: "0.65rem" }} className="text-muted-foreground">Done</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => setSelectedTerm(t.id)}
                    className="flex-1 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center justify-center gap-1 text-muted-foreground"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {t.status === "Upcoming" && (
                    <button
                      onClick={() => handleActivate(t.id)}
                      className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <Play className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                  {(t.status === "Completed" || t.status === "Active") && t.status !== "Archived" && (
                    <button
                      onClick={() => handleArchive(t.id)}
                      className="flex-1 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center justify-center gap-1 text-muted-foreground"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Term Detail Modal */}
      {selectedTermData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTerm(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <h2>{selectedTermData.name}</h2>
                  <StatusBadge status={selectedTermData.status} />
                </div>
              </div>
              <button onClick={() => setSelectedTerm(null)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Type</p>
                <p style={{ fontSize: "0.9rem" }}>{selectedTermData.type}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Eligible Levels</p>
                <p style={{ fontSize: "0.9rem" }}>{selectedTermData.eligibleLevels.join(", ")}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Application Period</p>
                <p style={{ fontSize: "0.9rem" }}>{selectedTermData.applicationStart} → {selectedTermData.applicationEnd}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Internship Period</p>
                <p style={{ fontSize: "0.9rem" }}>{selectedTermData.internshipStart} → {selectedTermData.internshipEnd}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: "0.8rem" }}>Participating Departments</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTermData.departments.map((d) => (
                  <span key={d} className="px-2.5 py-1 bg-secondary rounded-full" style={{ fontSize: "0.75rem" }}>{d}</span>
                ))}
              </div>
            </div>

            {selectedStats && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Apps", value: selectedStats.total, icon: FileText, color: "text-blue-600" },
                  { label: "Active", value: selectedStats.active, icon: GraduationCap, color: "text-emerald-600" },
                  { label: "Pending", value: selectedStats.pending, icon: Clock, color: "text-amber-600" },
                  { label: "Completed", value: selectedStats.completed, icon: CheckCircle2, color: "text-violet-600" },
                ].map((s) => (
                  <div key={s.label} className="border border-border rounded-lg p-3 text-center">
                    <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                    <p style={{ fontSize: "1.1rem" }}>{s.value}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              {selectedTermData.status === "Upcoming" && (
                <button
                  onClick={() => { handleActivate(selectedTermData.id); setSelectedTerm(null); }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Play className="w-4 h-4" /> Activate Term
                </button>
              )}
              {selectedTermData.status !== "Archived" && (
                <button
                  onClick={() => { handleArchive(selectedTermData.id); setSelectedTerm(null); }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
              )}
              <button onClick={() => setSelectedTerm(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}