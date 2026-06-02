import { useEffect, useState, useMemo } from "react";
import { departments as staticDepts, programsByDepartment } from "../../lib/mock-data";
import { apiClient } from "../../lib/api-client";
import { toast } from "sonner";
import {
  Building2, Plus, Edit2, Trash2, GraduationCap, BookOpen,
  Search, X, ChevronDown, ChevronRight, BookMarked, Layers
} from "lucide-react";

interface Program {
  name: string;
  type: "HND" | "BTech" | "BSc" | "BEng" | "BBA" | "Other";
}

interface Department {
  id: string;
  name: string;
  code: string;
  faculty?: string;
  programs: Program[];
  studentCount?: number;
  dloName?: string;
  hodName?: string;
}

function detectProgramType(name: string): Program["type"] {
  if (/^HND\b/i.test(name)) return "HND";
  if (/^BTech\b/i.test(name)) return "BTech";
  if (/^BSc\b/i.test(name)) return "BSc";
  if (/^BEng\b/i.test(name)) return "BEng";
  if (/^BBA\b/i.test(name)) return "BBA";
  return "Other";
}

function normalizeDept(d: any, index: number): Department {
  const staticPrograms = programsByDepartment[d.name] ?? [];
  const rawPrograms: string[] = Array.isArray(d.programs)
    ? d.programs.map((p: any) => (typeof p === "string" ? p : p.name))
    : staticPrograms;
  const programs: Program[] = rawPrograms.map((p) => ({ name: p, type: detectProgramType(p) }));
  const codeDefault = (d.name as string)
    ?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 5) ?? `D${index + 1}`;
  return {
    id: String(d.id ?? `dept-${index}`),
    name: d.name ?? `Department ${index + 1}`,
    code: d.code ?? codeDefault,
    faculty: d.faculty ?? d.faculty_name ?? undefined,
    programs,
    studentCount: d.student_count ?? d.students_count ?? undefined,
    dloName: d.dlo?.name ?? d.dlo_name ?? undefined,
    hodName: d.hod?.name ?? d.hod_name ?? undefined,
  };
}

function buildStaticDepts(): Department[] {
  return staticDepts.map((name, index) => {
    const programs: Program[] = (programsByDepartment[name] ?? []).map((p) => ({
      name: p,
      type: detectProgramType(p),
    }));
    const code = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 5);
    return { id: `static-${index}`, name, code, programs };
  });
}

const FACULTY_OPTIONS = [
  "Faculty of Engineering",
  "Faculty of Applied Sciences",
  "Faculty of Business Studies",
  "Faculty of Built Environment",
  "School of Engineering Technology",
  "Faculty of Computing & Information Technology",
];

export function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);

  const emptyForm = {
    name: "", code: "", faculty: "",
    hndPrograms: [] as string[], btechPrograms: [] as string[],
    newHnd: "", newBtech: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const res = await apiClient.getDepartments();
      if (!active) return;
      if (res.success && res.data.length > 0) {
        setDepts(res.data.map((d, i) => normalizeDept(d, i)));
      } else {
        setDepts(buildStaticDepts());
      }
      setLoading(false);
    };
    load().catch(() => {
      if (!active) return;
      setDepts(buildStaticDepts());
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(
    () => depts.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
    ),
    [depts, search]
  );

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      faculty: dept.faculty ?? "",
      hndPrograms: dept.programs.filter((p) => p.type === "HND").map((p) => p.name),
      btechPrograms: dept.programs.filter((p) => p.type === "BTech").map((p) => p.name),
      newHnd: "",
      newBtech: "",
    });
    setShowModal(true);
  };

  const addHnd = () => {
    if (!form.newHnd.trim()) return;
    const prog = /^HND\b/i.test(form.newHnd.trim()) ? form.newHnd.trim() : `HND ${form.newHnd.trim()}`;
    if (!form.hndPrograms.includes(prog))
      setForm({ ...form, hndPrograms: [...form.hndPrograms, prog], newHnd: "" });
    else setForm({ ...form, newHnd: "" });
  };

  const addBtech = () => {
    if (!form.newBtech.trim()) return;
    const prog = /^BTech\b/i.test(form.newBtech.trim()) ? form.newBtech.trim() : `BTech ${form.newBtech.trim()}`;
    if (!form.btechPrograms.includes(prog))
      setForm({ ...form, btechPrograms: [...form.btechPrograms, prog], newBtech: "" });
    else setForm({ ...form, newBtech: "" });
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Department name is required."); return; }
    const allPrograms: Program[] = [
      ...form.hndPrograms.map((p) => ({ name: p, type: "HND" as const })),
      ...form.btechPrograms.map((p) => ({ name: p, type: "BTech" as const })),
    ];
    const codeVal = form.code.trim() || form.name.split(" ").map((w) => w[0]).join("").toUpperCase();
    if (editTarget) {
      setDepts((prev) => prev.map((d) =>
        d.id === editTarget.id
          ? { ...d, name: form.name.trim(), code: codeVal, faculty: form.faculty || undefined, programs: allPrograms }
          : d
      ));
      toast.success(`${form.name} updated.`);
    } else {
      setDepts((prev) => [...prev, {
        id: `local-${Date.now()}`,
        name: form.name.trim(), code: codeVal,
        faculty: form.faculty || undefined, programs: allPrograms,
      }]);
      toast.success(`${form.name} added.`);
    }
    setShowModal(false);
    setEditTarget(null);
    setForm(emptyForm);
  };

  const handleDelete = (dept: Department) => {
    setDepts((prev) => prev.filter((d) => d.id !== dept.id));
    toast.success(`${dept.name} removed.`);
    setDeleteConfirm(null);
  };

  const totalPrograms = depts.reduce((acc, d) => acc + d.programs.length, 0);
  const hndCount = depts.reduce((acc, d) => acc + d.programs.filter((p) => p.type === "HND").length, 0);
  const btechCount = depts.reduce((acc, d) => acc + d.programs.filter((p) => p.type === "BTech").length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Department Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {loading
              ? "Loading departments..."
              : `${depts.length} department${depts.length !== 1 ? "s" : ""} · ${totalPrograms} programme${totalPrograms !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Departments", value: depts.length, icon: Building2, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Total Programmes", value: totalPrograms, icon: BookOpen, color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
          { label: "HND Programmes", value: hndCount, icon: GraduationCap, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "BTech Programmes", value: btechCount, icon: BookMarked, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
                <p style={{ fontSize: "1.35rem", fontWeight: 600, lineHeight: 1 }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card"
          style={{ fontSize: "0.85rem" }}
        />
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((dept) => {
          const hndPrograms = dept.programs.filter((p) => p.type === "HND");
          const btechPrograms = dept.programs.filter((p) => p.type === "BTech");
          const otherPrograms = dept.programs.filter((p) => p.type !== "HND" && p.type !== "BTech");
          const isExpanded = expandedDept === dept.id;

          return (
            <div
              key={dept.id}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] transition-all duration-200"
            >
              {/* Card header */}
              <div className="p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{dept.name}</p>
                    {dept.faculty && (
                      <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>{dept.faculty}</p>
                    )}
                    {/* Programme type badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 font-mono" style={{ fontSize: "0.68rem" }}>
                        {dept.code}
                      </span>
                      {hndPrograms.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700" style={{ fontSize: "0.72rem" }}>
                          <GraduationCap className="w-3 h-3" /> {hndPrograms.length} HND
                        </span>
                      )}
                      {btechPrograms.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontSize: "0.72rem" }}>
                          <BookMarked className="w-3 h-3" /> {btechPrograms.length} BTech
                        </span>
                      )}
                      {otherPrograms.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600" style={{ fontSize: "0.72rem" }}>
                          <BookOpen className="w-3 h-3" /> {otherPrograms.length} Other
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(dept)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                    title="Remove department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta row: DLO / HOD / Students */}
              {(dept.dloName || dept.hodName || dept.studentCount !== undefined) && (
                <div className="px-5 pb-3 flex items-center gap-4 flex-wrap">
                  {dept.dloName && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>DLO: <span className="text-foreground">{dept.dloName}</span></p>
                  )}
                  {dept.hodName && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>HOD: <span className="text-foreground">{dept.hodName}</span></p>
                  )}
                  {dept.studentCount !== undefined && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>Students: <span className="text-foreground">{dept.studentCount}</span></p>
                  )}
                </div>
              )}

              {/* Expand toggle */}
              <button
                onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                className="w-full px-5 py-2.5 flex items-center justify-between border-t border-border/50 hover:bg-muted/20 transition-colors text-left"
                style={{ fontSize: "0.8rem" }}
              >
                <span className="text-muted-foreground">
                  {dept.programs.length} programme{dept.programs.length !== 1 ? "s" : ""}
                </span>
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Expanded programmes list */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 space-y-4 border-t border-border/30 bg-muted/10">
                  {hndPrograms.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 uppercase tracking-widest" style={{ fontSize: "0.62rem", fontWeight: 600 }}>
                        HND Programmes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {hndPrograms.map((p) => (
                          <span
                            key={p.name}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {btechPrograms.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 uppercase tracking-widest" style={{ fontSize: "0.62rem", fontWeight: 600 }}>
                        BTech Programmes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {btechPrograms.map((p) => (
                          <span
                            key={p.name}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {otherPrograms.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 uppercase tracking-widest" style={{ fontSize: "0.62rem", fontWeight: 600 }}>
                        Other Programmes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {otherPrograms.map((p) => (
                          <span
                            key={p.name}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-500/20"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {dept.programs.length === 0 && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>No programmes added yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div
            className="col-span-2 text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border/50"
            style={{ fontSize: "0.85rem" }}
          >
            No departments match your search.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg my-8 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2>{editTarget ? "Edit Department" : "Add Department"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block mb-1 text-foreground" style={{ fontSize: "0.8rem" }}>
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              {/* Code & Faculty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground" style={{ fontSize: "0.8rem" }}>Short Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 5) })}
                    placeholder="e.g., CS"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground" style={{ fontSize: "0.8rem" }}>Faculty</label>
                  <select
                    value={form.faculty}
                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="">— None —</option>
                    {FACULTY_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* HND Programmes */}
              <div>
                <label className="block mb-1 text-foreground" style={{ fontSize: "0.8rem" }}>HND Programmes</label>
                {form.hndPrograms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.hndPrograms.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700" style={{ fontSize: "0.78rem" }}>
                        {p}
                        <button
                          onClick={() => setForm({ ...form, hndPrograms: form.hndPrograms.filter((x) => x !== p) })}
                          className="ml-0.5 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.newHnd}
                    onChange={(e) => setForm({ ...form, newHnd: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHnd(); } }}
                    placeholder="Programme name — press Enter or Add"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.82rem" }}
                  />
                  <button
                    type="button"
                    onClick={addHnd}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:opacity-90 shrink-0"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.72rem" }}>
                  "HND" prefix is added automatically if omitted.
                </p>
              </div>

              {/* BTech Programmes */}
              <div>
                <label className="block mb-1 text-foreground" style={{ fontSize: "0.8rem" }}>BTech Programmes</label>
                {form.btechPrograms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.btechPrograms.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontSize: "0.78rem" }}>
                        {p}
                        <button
                          onClick={() => setForm({ ...form, btechPrograms: form.btechPrograms.filter((x) => x !== p) })}
                          className="ml-0.5 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.newBtech}
                    onChange={(e) => setForm({ ...form, newBtech: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBtech(); } }}
                    placeholder="Programme name — press Enter or Add"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.82rem" }}
                  />
                  <button
                    type="button"
                    onClick={addBtech}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 shrink-0"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.72rem" }}>
                  "BTech" prefix is added automatically if omitted.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                {editTarget ? "Save Changes" : "Add Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Remove Department?</h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>?
              This will not affect existing students or records.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
