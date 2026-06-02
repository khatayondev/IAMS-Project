import { useEffect, useState, useMemo } from "react";
import { departments as staticDepts } from "../../lib/mock-data";
import { apiClient } from "../../lib/api-client";
import { toast } from "sonner";
import {
  Building2, Plus, Edit2, UserCheck,
  Search, X, Layers, User
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "active" | "inactive";
  headName?: string;
  headRole?: string;
}

function normalizeDept(d: any, index: number): Department {
  const headUser = d.department_head?.user ?? null;
  return {
    id: String(d.id ?? `dept-${index}`),
    name: d.name ?? `Department ${index + 1}`,
    code: d.code ?? (d.name as string)?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 5) ?? `D${index + 1}`,
    description: d.description ?? undefined,
    contactEmail: d.contact_email ?? undefined,
    contactPhone: d.contact_phone ?? undefined,
    status: d.status === "inactive" ? "inactive" : "active",
    headName: headUser?.name ?? undefined,
    headRole: headUser?.role ?? undefined,
  };
}

function buildStaticDepts(): Department[] {
  return staticDepts.map((name, index) => {
    const code = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 5);
    return { id: `static-${index}`, name, code, status: "active" as const };
  });
}

const emptyForm = {
  name: "", code: "", description: "", contactEmail: "", contactPhone: "",
};

export function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
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

  const activeCount = depts.filter((d) => d.status === "active").length;
  const hodCount = depts.filter((d) => !!d.headName).length;
  const contactCount = depts.filter((d) => !!d.contactEmail).length;

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
      description: dept.description ?? "",
      contactEmail: dept.contactEmail ?? "",
      contactPhone: dept.contactPhone ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Department name is required."); return; }
    if (!form.code.trim()) { toast.error("Short code is required."); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.contactEmail.trim() ? { contact_email: form.contactEmail.trim() } : {}),
      ...(form.contactPhone.trim() ? { contact_phone: form.contactPhone.trim() } : {}),
    };

    if (editTarget) {
      const res = await apiClient.updateDepartment(editTarget.id, payload);
      if (res.success) {
        setDepts((prev) => prev.map((d) =>
          d.id === editTarget.id
            ? { ...d, name: payload.name, code: payload.code, description: payload.description, contactEmail: payload.contact_email, contactPhone: payload.contact_phone }
            : d
        ));
        toast.success(`${payload.name} updated.`);
      } else {
        toast.error(res.message ?? "Failed to update department.");
      }
    } else {
      const res = await apiClient.createDepartment(payload);
      if (res.success && res.data) {
        setDepts((prev) => [...prev, normalizeDept(res.data, prev.length)]);
        toast.success(`${payload.name} created.`);
      } else {
        toast.error(res.message ?? "Failed to create department.");
      }
    }

    setSaving(false);
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Department Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {loading ? "Loading departments…" : `${depts.length} department${depts.length !== 1 ? "s" : ""}`}
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
          { label: "Active", value: activeCount, icon: Layers, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "HOD Assigned", value: hodCount, icon: UserCheck, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "With Contact", value: contactCount, icon: User, color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
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
        {filtered.map((dept) => (
          <div
            key={dept.id}
            className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{dept.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${dept.status === "active" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400"}`}
                    >
                      {dept.status}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono" style={{ fontSize: "0.72rem" }}>{dept.code}</span>
                  {dept.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-2" style={{ fontSize: "0.78rem" }}>{dept.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEdit(dept)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Edit department"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Footer: head & contact */}
            {(dept.headName || dept.contactEmail || dept.contactPhone) && (
              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-x-4 gap-y-1.5">
                {dept.headName && (
                  <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.78rem" }}>
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-foreground font-medium">{dept.headName}</span>
                    {dept.headRole && (
                      <span className="uppercase font-mono bg-muted px-1.5 py-0.5 rounded" style={{ fontSize: "0.62rem" }}>{dept.headRole}</span>
                    )}
                  </span>
                )}
                {dept.contactEmail && (
                  <span className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>{dept.contactEmail}</span>
                )}
                {dept.contactPhone && (
                  <span className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>{dept.contactPhone}</span>
                )}
              </div>
            )}
          </div>
        ))}

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
            className="bg-card border border-border rounded-2xl w-full max-w-md my-8 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2>{editTarget ? "Edit Department" : "Add Department"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8rem" }}>
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

              <div>
                <label className="block mb-1" style={{ fontSize: "0.8rem" }}>
                  Short Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 8) })}
                  placeholder="e.g., CS"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label className="block mb-1 text-muted-foreground" style={{ fontSize: "0.8rem" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional — brief description of the department"
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-muted-foreground" style={{ fontSize: "0.8rem" }}>Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="dept@htu.edu.gh"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.82rem" }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-muted-foreground" style={{ fontSize: "0.8rem" }}>Contact Phone</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+233..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.82rem" }}
                  />
                </div>
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
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
                style={{ fontSize: "0.85rem" }}
              >
                {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
