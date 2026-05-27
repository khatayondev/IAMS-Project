import { useEffect, useMemo, useState } from "react";
import { staffList, departments } from "../../lib/mock-data";
import { Search, UserPlus, Mail, Shield, X, Users, CheckCircle2, XCircle, MoreVertical, Eye } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/api-client";

type RoleFilter = "All" | "DLO" | "Academic Supervisor" | "HOD" | "Staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  isLiaison: boolean;
  role?: string;
  status?: "Active" | "Inactive";
}

const enrichedStaff: StaffMember[] = staffList.map((s, i) => ({
  ...s,
  role: s.isLiaison ? "DLO" : i % 3 === 0 ? "Academic Supervisor" : i % 5 === 0 ? "HOD" : "Staff",
  status: "Active" as const,
}));

function normalizeRemoteUsers(users: any[]): StaffMember[] {
  return users.map((user, index) => {
    const fullName = user.name ?? user.full_name ?? [user.first_name, user.last_name].filter(Boolean).join(" ") ?? `User ${index + 1}`;
    const rawRole = String(user.role ?? user.user_role ?? user.type ?? "Staff").toLowerCase();
    const role = rawRole.includes("hod")
      ? "HOD"
      : rawRole.includes("supervisor")
        ? "Academic Supervisor"
        : rawRole.includes("dlo")
          ? "DLO"
          : "Staff";

    return {
      id: String(user.id ?? user.user_id ?? `user-${index}`),
      name: fullName,
      email: user.email ?? user.email_address ?? "",
      department: user.department?.name ?? user.department_name ?? user.department ?? departments[index % departments.length],
      isLiaison: role === "DLO",
      role,
      status: user.status === "invited" ? "Inactive" : "Active",
    };
  });
}

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: departments[0], role: "DLO" });
  const [users, setUsers] = useState<StaffMember[]>(enrichedStaff);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      const response = await apiClient.getUsers();
      if (!active) return;

      if (response.success && response.data.length > 0) {
        setUsers(normalizeRemoteUsers(response.data));
      } else {
        setUsers(enrichedStaff);
      }
      setLoading(false);
    }

    loadUsers().catch(() => {
      if (!active) return;
      setUsers(enrichedStaff);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = users.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || s.department === deptFilter;
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    return matchSearch && matchDept && matchRole;
  });

  const visibleUsers = useMemo(() => filtered, [filtered]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedUsers(next);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast.error("Name and email are required.");
      return;
    }

    if (inviteForm.role === "DLO") {
      const result = await apiClient.createDLOAccount({
        name: inviteForm.name,
        email: inviteForm.email,
        department_id: departments.indexOf(inviteForm.department) + 1,
        staff_id: `STAFF-${Date.now().toString().slice(-6)}`,
      });

      if (!result.success) {
        toast.error(result.message ?? "Failed to create DLO account.");
        return;
      }
    }

    toast.success(`Invitation sent to ${inviteForm.name} (${inviteForm.email}) as ${inviteForm.role}.`);
    setShowInvite(false);
    setInviteForm({ name: "", email: "", department: departments[0], role: "DLO" });
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      DLO: "bg-blue-100 text-blue-700",
      "Academic Supervisor": "bg-violet-100 text-violet-700",
      HOD: "bg-amber-100 text-amber-700",
      Staff: "bg-gray-100 text-gray-600",
    };
    return colors[role] || "bg-gray-100 text-gray-600";
  };

  const roleCounts = {
    All: users.length,
    DLO: users.filter((s) => s.role === "DLO").length,
    "Academic Supervisor": users.filter((s) => s.role === "Academic Supervisor").length,
    HOD: users.filter((s) => s.role === "HOD").length,
    Staff: users.filter((s) => s.role === "Staff").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {loading ? "Loading users from the API..." : "Manage system users, roles, and access permissions"}
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
        {(["All", "DLO", "Academic Supervisor", "HOD", "Staff"] as RoleFilter[]).map((role) => (
          <button
            key={role}
            onClick={() => { setRoleFilter(role); setSelectedUsers(new Set()); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              roleFilter === role
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-accent"
            }`}
            style={{ fontSize: "0.85rem" }}
          >
            {role}
            <span
              className={`px-1.5 py-0.5 rounded-full ${roleFilter === role ? "bg-white/20" : "bg-secondary"}`}
              style={{ fontSize: "0.7rem" }}
            >
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
          <option>All</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              {selectedUsers.size} selected
            </span>
            <button
              onClick={() => {
                toast.success(`Bulk invitation resent to ${selectedUsers.size} user(s).`);
                setSelectedUsers(new Set());
              }}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1"
              style={{ fontSize: "0.8rem" }}
            >
              <Mail className="w-3.5 h-3.5" /> Resend Invites
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: enrichedStaff.length, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active DLOs", value: roleCounts.DLO, icon: Shield, color: "text-violet-600 bg-violet-50" },
          { label: "Academic Supervisors", value: roleCounts["Academic Supervisor"], icon: Eye, color: "text-emerald-600 bg-emerald-50" },
          { label: "Departments Covered", value: new Set(enrichedStaff.filter((s) => s.isLiaison).map((s) => s.department)).size, icon: CheckCircle2, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
                <p style={{ fontSize: "1.25rem" }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === visibleUsers.length && visibleUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Name</th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Email</th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Department</th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Role</th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Status</th>
              <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((s) => (
              <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${selectedUsers.has(s.id) ? "bg-primary/5" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0" style={{ fontSize: "0.7rem" }}>
                    {s.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <span style={{ fontSize: "0.85rem" }}>{s.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.85rem" }}>{s.email}</td>
                <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{s.department}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${roleBadge(s.role || "Staff")}`} style={{ fontSize: "0.75rem" }}>
                    <Shield className="w-3 h-3" /> {s.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700" style={{ fontSize: "0.75rem" }}>
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === s.id ? null : s.id)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenu === s.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                          {s.role !== "DLO" && (
                            <button
                              onClick={() => { toast.success(`${s.name} assigned as DLO.`); setActionMenu(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <Shield className="w-3.5 h-3.5" /> Assign DLO
                            </button>
                          )}
                          <button
                            onClick={() => { toast.success(`Role changed for ${s.name}.`); setActionMenu(null); }}
                            className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <Users className="w-3.5 h-3.5" /> Change Role
                          </button>
                          <button
                            onClick={() => { toast.success("Invitation resent."); setActionMenu(null); }}
                            className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <Mail className="w-3.5 h-3.5" /> Resend Invite
                          </button>
                          <button
                            onClick={() => { toast.success(`${s.name} deactivated.`); setActionMenu(null); }}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-red-600 flex items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Invite New User</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              An invitation email with login instructions will be sent to the user.
            </p>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: "0.8rem" }}>Full Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g., Dr. Kofi Mensah"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="e.g., k.mensah@htu.edu.gh"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Department</label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {departments.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option>DLO</option>
                    <option>Academic Supervisor</option>
                    <option>HOD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                <Mail className="w-4 h-4" /> Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}