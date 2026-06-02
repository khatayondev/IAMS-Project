import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Mail, Shield, X, Users, CheckCircle2, XCircle, MoreVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/api-client";

type RoleFilter = "All" | "clo" | "dlo" | "academic supervisor" | "industry supervisor" | "student" | "hod";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "active" | "inactive";
}

interface DeptOption {
  id: number;
  name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeRole(raw: string): string {
  const r = raw.toLowerCase().replace(/-/g, " ").trim();
  if (r.includes("clo")) return "clo";
  if (r.includes("dlo")) return "dlo";
  if (r.includes("academic") || (r.includes("supervisor") && !r.includes("industry"))) return "academic supervisor";
  if (r.includes("industry") || r.includes("industrial")) return "industry supervisor";
  if (r.includes("hod")) return "hod";
  return "student";
}

function normalizeUser(user: any, index: number): StaffMember {
  const name = user.name ?? user.full_name ?? [user.first_name, user.last_name].filter(Boolean).join(" ") ?? `User ${index + 1}`;
  const rawRole = String(user.role ?? user.user_role ?? user.type ?? "student");
  const rawStatus = String(user.status ?? "active").toLowerCase();
  return {
    id: String(user.id ?? user.user_id ?? `user-${index}`),
    name,
    email: user.email ?? user.email_address ?? "",
    department: user.department?.name ?? user.department_name ?? user.department ?? "—",
    role: normalizeRole(rawRole),
    status: rawStatus === "active" ? "active" : "inactive",
  };
}

const roleBadgeClass: Record<string, string> = {
  clo: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
  dlo: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "academic supervisor": "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "industry supervisor": "bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300",
  student: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  hod: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

// ── Component ──────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [depts, setDepts] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "", email: "", staff_id: "", phone: "",
    department_id: "" as string, role: "dlo",
  });

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDepartments(),
      ]);
      if (!active) return;
      setUsers(usersRes.success ? usersRes.data.map(normalizeUser) : []);
      if (deptsRes.success && deptsRes.data.length > 0) {
        const opts: DeptOption[] = deptsRes.data.map((d: any) => ({ id: Number(d.id), name: d.name ?? "" }));
        setDepts(opts);
        setInviteForm((f) => ({ ...f, department_id: String(opts[0]?.id ?? "") }));
      }
      setLoading(false);
    };
    load().catch(() => { if (active) { setLoading(false); } });
    return () => { active = false; };
  }, []);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || u.department === deptFilter;
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchDept && matchRole;
  }), [users, search, deptFilter, roleFilter]);

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedUsers(next);
  };
  const toggleSelectAll = () => {
    setSelectedUsers(selectedUsers.size === filtered.length ? new Set() : new Set(filtered.map((u) => u.id)));
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (user: StaffMember) => {
    setActionLoading(user.id);
    setActionMenu(null);
    const isActive = user.status === "active";
    const res = isActive
      ? await apiClient.deactivateUser(user.id)
      : await apiClient.activateUser(user.id);

    if (res.success) {
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, status: isActive ? "inactive" : "active" } : u
      ));
      toast.success(`${user.name} ${isActive ? "deactivated" : "activated"}.`);
    } else {
      toast.error(res.message ?? `Failed to ${isActive ? "deactivate" : "activate"} user.`);
    }
    setActionLoading(null);
  };

  // ── Invite ──────────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (!inviteForm.department_id) {
      toast.error("Please select a department.");
      return;
    }
    if (!inviteForm.staff_id.trim()) {
      toast.error("Staff ID is required.");
      return;
    }

    setInviteSaving(true);
    const res = await apiClient.createDLOAccount({
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      department_id: Number(inviteForm.department_id),
      staff_id: inviteForm.staff_id.trim(),
      phone: inviteForm.phone.trim() || undefined,
    });

    if (res.success) {
      toast.success(`DLO account created for ${inviteForm.name}.`);
      // Reload users to get the new user
      const usersRes = await apiClient.getUsers();
      if (usersRes.success) setUsers(usersRes.data.map(normalizeUser));
      setShowInvite(false);
      setInviteForm({ name: "", email: "", staff_id: "", phone: "", department_id: String(depts[0]?.id ?? ""), role: "dlo" });
    } else {
      toast.error(res.message ?? "Failed to create user account.");
    }
    setInviteSaving(false);
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const roleCounts = {
    All: users.length,
    clo: users.filter((u) => u.role === "clo").length,
    dlo: users.filter((u) => u.role === "dlo").length,
    "academic supervisor": users.filter((u) => u.role === "academic supervisor").length,
    "industry supervisor": users.filter((u) => u.role === "industry supervisor").length,
    student: users.filter((u) => u.role === "student").length,
    hod: users.filter((u) => u.role === "hod").length,
  };
  const activeCount   = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

  // ── Row action menu ─────────────────────────────────────────────────────────
  const ActionMenu = ({ user }: { user: StaffMember }) => {
    const isLoading = actionLoading === user.id;
    return (
      <div className="relative">
        <button
          onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
          disabled={isLoading}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-40"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {actionMenu === user.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
            <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {user.status === "active" ? (
                <button
                  onClick={() => handleToggleStatus(user)}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent text-red-600 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <XCircle className="w-3.5 h-3.5" /> Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(user)}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent text-emerald-600 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {loading ? "Loading users…" : "Manage system users, roles, and access permissions"}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["All", "clo", "dlo", "academic supervisor", "industry supervisor", "student", "hod"] as RoleFilter[]).map((role) => (
          <button
            key={role}
            onClick={() => { setRoleFilter(role); setSelectedUsers(new Set()); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${roleFilter === role ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-accent"}`}
            style={{ fontSize: "0.85rem" }}
          >
            {role}
            <span className={`px-1.5 py-0.5 rounded-full ${roleFilter === role ? "bg-white/20" : "bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
              {roleCounts[role]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card"
          style={{ fontSize: "0.85rem" }}
        >
          <option value="All">All Departments</option>
          {depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>{selectedUsers.size} selected</span>
            <button onClick={() => setSelectedUsers(new Set())} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users",  value: users.length,  icon: Users,       color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Active",       value: activeCount,   icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Inactive",     value: inactiveCount, icon: AlertCircle,  color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Active DLOs",  value: roleCounts.dlo, icon: Shield,      color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border" style={{ fontSize: "0.85rem" }}>
            No users match your filters.
          </div>
        ) : filtered.map((u) => (
          <div
            key={u.id}
            className={`bg-card border rounded-xl p-4 space-y-3 transition-colors ${selectedUsers.has(u.id) ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => toggleSelect(u.id)}>
                <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded shrink-0" />
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0" style={{ fontSize: "0.7rem" }}>
                  {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ fontSize: "0.9rem" }}>{u.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>{u.email}</p>
                </div>
              </div>
              <ActionMenu user={u} />
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${roleBadgeClass[u.role] ?? "bg-gray-100 text-gray-600"}`} style={{ fontSize: "0.75rem" }}>
                <Shield className="w-3 h-3" /> {u.role}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300"}`}
                  style={{ fontSize: "0.72rem" }}
                >
                  {u.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {u.status}
                </span>
                <span className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>{u.department}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              {["Name", "Email", "Department", "Role", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium" style={{ fontSize: "0.75rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                  No users match your filters.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${selectedUsers.has(u.id) ? "bg-primary/5" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0" style={{ fontSize: "0.7rem" }}>
                      {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.85rem" }}>{u.email}</td>
                <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{u.department}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${roleBadgeClass[u.role] ?? "bg-gray-100 text-gray-600"}`} style={{ fontSize: "0.75rem" }}>
                    <Shield className="w-3 h-3" /> {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300"}`}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {u.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ActionMenu user={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Invite Modal ────────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div
            className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2>Create DLO Account</h2>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8rem" }}>Creates a login account for a Departmental Liaison Officer</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.8rem" }}>Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="e.g., Dr. Kofi Mensah"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.8rem" }}>Staff ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={inviteForm.staff_id}
                    onChange={(e) => setInviteForm({ ...inviteForm, staff_id: e.target.value })}
                    placeholder="e.g., HTU/STAFF/DLO/001"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "0.8rem" }}>Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="e.g., k.mensah@htu.edu.gh"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.8rem" }}>Department <span className="text-red-500">*</span></label>
                  <select
                    value={inviteForm.department_id}
                    onChange={(e) => setInviteForm({ ...inviteForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {depts.length === 0 && <option value="">Loading…</option>}
                    {depts.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.8rem" }}>Phone</label>
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="+233..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviteSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                <Mail className="w-4 h-4" /> {inviteSaving ? "Creating…" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
