import { StatCard } from "../../components/stat-card";
import { StatusBadge } from "../../components/status-badge";
import { useAppContext } from "../../lib/context";
import { checkInactiveStudents } from "../../services/logbook-service";
import {
  Building2, FileText, GraduationCap, Clock, AlertTriangle, UserPlus,
  ArrowRight, TrendingUp, CheckCircle2, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  Legend, CartesianGrid
} from "recharts";
import { useNavigate } from "react-router";

const COLORS = ["#0B5ED7", "#10B981", "#F59E0B", "#8B5CF6", "#14B8A6"];

export function DLODashboard() {
  const { user, store } = useAppContext();
  const navigate = useNavigate();
  const dept = user?.department || "Computer Science";

  const deptApps = store.applications.filter((a) => a.department === dept);
  const pendingApps = deptApps.filter((a) => a.status === "Pending").length;
  const activeStudents = deptApps.filter((a) => a.status === "Active").length;
  const completedStudents = deptApps.filter((a) => a.status === "Completed").length;
  const pendingCompanies = store.companies.filter((c) => c.status === "Pending" && c.department === dept).length;
  const needSupervisor = deptApps.filter((a) => a.status === "Company Accepted").length;
  const activityData = checkInactiveStudents();

  const placementRate = deptApps.length > 0
    ? Math.round(((activeStudents + completedStudents) / deptApps.length) * 100)
    : 0;

  // Placement funnel
  const funnelData = [
    { name: "Applied", stage: "Applied", count: deptApps.length },
    { name: "Approved", stage: "Approved", count: deptApps.filter((a) => ["Approved", "Company Accepted", "Active", "Completed"].includes(a.status)).length },
    { name: "Co. Accepted", stage: "Co. Accepted", count: deptApps.filter((a) => ["Company Accepted", "Active", "Completed"].includes(a.status)).length },
    { name: "Active", stage: "Active", count: activeStudents },
    { name: "Completed", stage: "Completed", count: completedStudents },
  ];

  // Status distribution for pie chart
  const statusData = [
    { id: "active", name: "Active", value: activeStudents, color: "#3B82F6" },
    { id: "pending", name: "Pending", value: pendingApps, color: "#F59E0B" },
    { id: "completed", name: "Completed", value: completedStudents, color: "#8B5CF6" },
    { id: "co-accepted", name: "Co. Accepted", value: needSupervisor, color: "#14B8A6" },
    { id: "approved", name: "Approved", value: deptApps.filter((a) => a.status === "Approved").length, color: "#10B981" },
  ].filter((d) => d.value > 0);

  const flaggedStudents = activityData.filter((s) => s.status === "red");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Department Dashboard</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>{dept} · Departmental Liaison Overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/dlo/applications")}
            className="px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Review Applications</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Dept Applications" value={deptApps.length} subtitle="Current term" icon={<FileText className="w-4 h-4" />} highlight />
        <StatCard title="Active Students" value={activeStudents} subtitle="At companies" icon={<GraduationCap className="w-4 h-4" />} />
        <StatCard title="Pending Review" value={pendingApps} subtitle="Awaiting your approval" icon={<Clock className="w-4 h-4" />} />
        <StatCard title="Placement Rate" value={`${placementRate}%`} subtitle="Active + completed" icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard title="Companies Pending" value={pendingCompanies} subtitle="Need your approval" icon={<Building2 className="w-4 h-4" />} />
      </div>

      {/* Alert Banners */}
      {(needSupervisor > 0 || flaggedStudents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {needSupervisor > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem" }} className="text-amber-800">
                  {needSupervisor} student(s) need academic supervisor assignment
                </p>
                <p style={{ fontSize: "0.75rem" }} className="text-amber-600">
                  Company acceptance received — assign in Supervisors page
                </p>
              </div>
              <button
                onClick={() => navigate("/dlo/supervisors")}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1 shrink-0"
                style={{ fontSize: "0.8rem" }}
              >
                Assign <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {flaggedStudents.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem" }} className="text-red-800">
                  {flaggedStudents.length} student(s) flagged — inactive 3+ days
                </p>
                <p style={{ fontSize: "0.75rem" }} className="text-red-600">
                  {flaggedStudents.map((s) => s.studentName).join(", ")}
                </p>
              </div>
              <button
                onClick={() => navigate("/dlo/students")}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1 shrink-0"
                style={{ fontSize: "0.8rem" }}
              >
                View <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Placement Funnel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Placement Funnel</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={85} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B5ED7" radius={[0, 6, 6, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-4">Status Distribution</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" isAnimationActive={false}>
                  {statusData.map((entry, i) => (
                    <Cell key={`cell-${entry.id}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Review Applications", count: pendingApps, icon: FileText, path: "/dlo/applications", color: "text-blue-600 bg-blue-50" },
          { label: "Approve Companies", count: pendingCompanies, icon: Building2, path: "/dlo/companies", color: "text-emerald-600 bg-emerald-50" },
          { label: "Assign Supervisors", count: needSupervisor, icon: UserPlus, path: "/dlo/supervisors", color: "text-violet-600 bg-violet-50" },
          { label: "View Reports", count: null, icon: TrendingUp, path: "/dlo/reports", color: "text-orange-600 bg-orange-50" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow text-left group"
          >
            <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
              <action.icon className="w-4.5 h-4.5" />
            </div>
            <p style={{ fontSize: "0.85rem" }} className="group-hover:text-primary transition-colors">{action.label}</p>
            {action.count !== null && action.count > 0 && (
              <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground mt-0.5">{action.count} pending</p>
            )}
          </button>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Applications */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3>Recent Applications</h3>
            <button onClick={() => navigate("/dlo/applications")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Student</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Company</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptApps.slice(0, 5).map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                      <div>
                        <p>{app.studentName}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{app.studentId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.companyName}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3>Student Activity Monitor</h3>
            <button onClick={() => navigate("/dlo/students")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
              View all
            </button>
          </div>
          <div className="p-3 space-y-2">
            {activityData.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status === "green" ? "bg-emerald-500" : s.status === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.85rem" }} className="truncate">{s.studentName}</p>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground">Last log: {s.daysSinceLog}d ago</p>
                </div>
                {s.status === "red" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                {s.status === "green" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-2" /> Warning
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-2" /> Flagged (3+ days)
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3>Recent Notifications</h3>
          <button onClick={() => navigate("/dlo/communications")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
            View all
          </button>
        </div>
        <div className="divide-y divide-border">
          {store.notifications.slice(0, 4).map((n) => (
            <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? "bg-secondary/30" : ""}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem" }}>{n.title}</p>
                <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground">{n.message}</p>
              </div>
              <span className="ml-auto text-muted-foreground shrink-0" style={{ fontSize: "0.7rem" }}>
                {new Date(n.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}