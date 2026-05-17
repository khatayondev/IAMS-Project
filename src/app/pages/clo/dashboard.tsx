import { StatCard } from "../../components/stat-card";
import { StatusBadge } from "../../components/status-badge";
import { useAppContext } from "../../lib/context";
import { departments } from "../../lib/mock-data";
import { checkInactiveStudents } from "../../services/logbook-service";
import { exportToCSV } from "../../lib/csv-export";
import {
  Building2, FileText, GraduationCap, Clock, AlertTriangle, TrendingUp,
  ArrowRight, CheckCircle2, UserPlus, Zap, Download
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from "recharts";
import { useNavigate } from "react-router";

const COLORS = ["#0B5ED7", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

const weeklyTrend = [
  { week: "W1 Mar", applications: 3, placements: 1 },
  { week: "W2 Mar", applications: 5, placements: 2 },
  { week: "W3 Mar", applications: 4, placements: 3 },
  { week: "W4 Mar", applications: 6, placements: 4 },
  { week: "W1 Apr", applications: 8, placements: 5 },
  { week: "W2 Apr", applications: 7, placements: 6 },
  { week: "W3 Apr", applications: 3, placements: 2 },
];

export function CLODashboard() {
  const { store } = useAppContext();
  const navigate = useNavigate();
  const { applications, companies, notifications, terms } = store;

  const activeTerm = terms.find((t) => t.status === "Active");
  const pendingApps = applications.filter((a) => a.status === "Pending").length;
  const activeStudents = applications.filter((a) => a.status === "Active").length;
  const pendingCompanies = companies.filter((c) => c.status === "Pending").length;
  const completedStudents = applications.filter((a) => a.status === "Completed").length;
  const approvedCompanies = companies.filter((c) => c.status === "Approved").length;
  const needSupervisor = applications.filter((a) => a.status === "Company Accepted").length;

  const deptData = departments
    .map((d) => ({
      name: d,
      active: applications.filter((a) => a.department === d && a.status === "Active").length,
      pending: applications.filter((a) => a.department === d && a.status === "Pending").length,
      completed: applications.filter((a) => a.department === d && a.status === "Completed").length,
    }))
    .filter((d) => d.active + d.pending + d.completed > 0);

  const statusData = [
    { name: "Active", value: activeStudents, color: "#3B82F6" },
    { name: "Pending", value: pendingApps, color: "#F59E0B" },
    { name: "Completed", value: completedStudents, color: "#8B5CF6" },
    { name: "Accepted", value: applications.filter((a) => a.status === "Company Accepted").length, color: "#14B8A6" },
    { name: "Approved", value: applications.filter((a) => a.status === "Approved").length, color: "#10B981" },
  ].filter((d) => d.value > 0);

  const placementRate = applications.length > 0
    ? Math.round(((activeStudents + completedStudents) / applications.length) * 100)
    : 0;

  const activityData = checkInactiveStudents();
  const flaggedStudents = activityData.filter((s) => s.status === "red");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Central Liaison Dashboard</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {activeTerm ? `Active Term: ${activeTerm.name}` : "No active term"} · System-wide overview
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/clo/terms")}
            className="px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">New Term</span>
          </button>
          <button
            className="px-3 md:px-4 py-2 bg-card border-0 rounded-xl hover:shadow-[0_2px_8px_rgba(11,94,215,0.08)] transition-all duration-200 flex items-center gap-2 text-foreground"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              exportToCSV(
                applications.map(a => ({
                  Student: a.studentName, ID: a.studentId, Company: a.companyName,
                  Department: a.department, Status: a.status, Date: a.dateApplied
                })),
                "clo_applications_export"
              );
            }}
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Data</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Applications" value={applications.length} subtitle="Current term" icon={<FileText className="w-4 h-4" />} highlight />
        <StatCard title="Active Placements" value={activeStudents} subtitle="At companies now" icon={<GraduationCap className="w-4 h-4" />} />
        <StatCard title="Pending Review" value={pendingApps} subtitle="Awaiting approval" icon={<Clock className="w-4 h-4" />} />
        <StatCard title="Placement Rate" value={`${placementRate}%`} subtitle="Active + completed" icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard title="Approved Companies" value={approvedCompanies} subtitle={`${pendingCompanies} pending`} icon={<Building2 className="w-4 h-4" />} />
      </div>

      {/* Alert Banners */}
      {(flaggedStudents.length > 0 || needSupervisor > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {flaggedStudents.length > 0 && (
            <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem" }} className="text-red-800">
                  {flaggedStudents.length} student(s) flagged — inactive for 3+ days
                </p>
                <p style={{ fontSize: "0.75rem" }} className="text-red-600">
                  {flaggedStudents.map((s) => s.studentName).join(", ")}
                </p>
              </div>
              <button
                onClick={() => navigate("/clo/students")}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1 shrink-0"
                style={{ fontSize: "0.8rem" }}
              >
                View <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {needSupervisor > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem" }} className="text-amber-800">
                  {needSupervisor} student(s) awaiting supervisor assignment
                </p>
                <p style={{ fontSize: "0.75rem" }} className="text-amber-600">Company acceptance received</p>
              </div>
              <button
                onClick={() => navigate("/clo/applications")}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1 shrink-0"
                style={{ fontSize: "0.8rem" }}
              >
                Assign <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Review Applications", count: pendingApps, icon: FileText, path: "/clo/applications", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Approve Companies", count: pendingCompanies, icon: Building2, path: "/clo/companies", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "View Reports", count: null, icon: TrendingUp, path: "/clo/reports", color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
          { label: "Manage Users", count: null, icon: Zap, path: "/clo/users", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-card rounded-2xl p-4 hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] transition-all duration-200 text-left group"
          >
            <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
              <action.icon className="w-4.5 h-4.5" />
            </div>
            <p style={{ fontSize: "0.85rem" }} className="group-hover:text-primary transition-colors">{action.label}</p>
            {action.count !== null && (
              <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground mt-0.5">{action.count} pending</p>
            )}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3>Application & Placement Trend</h3>
            <div className="flex items-center gap-3" style={{ fontSize: "0.75rem" }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0B5ED7]" />Applications</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />Placements</span>
            </div>
          </div>
          <div className="h-56 flex items-end gap-3 px-2">
            {(() => {
              const max = Math.max(1, ...weeklyTrend.flatMap(w => [w.applications, w.placements]));
              return weeklyTrend.map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center gap-1 flex-1">
                    <div className="w-1/2 bg-[#0B5ED7] rounded-t" style={{ height: `${(w.applications / max) * 100}%` }} title={`Applications: ${w.applications}`} />
                    <div className="w-1/2 bg-[#10B981] rounded-t" style={{ height: `${(w.placements / max) * 100}%` }} title={`Placements: ${w.placements}`} />
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>{w.week}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Status Donut */}
        <div className="bg-card rounded-2xl p-5">
          <h3 className="mb-4">Status Distribution</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" isAnimationActive={false}>
                  {statusData.map((entry, i) => (
                    <Cell key={`status-cell-${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3>Department Breakdown</h3>
          <div className="flex items-center gap-3" style={{ fontSize: "0.75rem" }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />Active</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />Completed</span>
          </div>
        </div>
        <div className="h-56 flex items-end gap-4 px-2">
          {(() => {
            const max = Math.max(1, ...deptData.flatMap(d => [d.active, d.pending, d.completed]));
            return deptData.map((d) => (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div className="w-1/3 bg-[#3B82F6] rounded-t" style={{ height: `${(d.active / max) * 100}%` }} title={`Active: ${d.active}`} />
                  <div className="w-1/3 bg-[#F59E0B] rounded-t" style={{ height: `${(d.pending / max) * 100}%` }} title={`Pending: ${d.pending}`} />
                  <div className="w-1/3 bg-[#8B5CF6] rounded-t" style={{ height: `${(d.completed / max) * 100}%` }} title={`Completed: ${d.completed}`} />
                </div>
                <span className="text-muted-foreground truncate w-full text-center" style={{ fontSize: "0.65rem" }} title={d.name}>{d.name}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Recent & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3>Recent Applications</h3>
            <button onClick={() => navigate("/clo/applications")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Student</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Company</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Department</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Status</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 6).map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                      <div>
                        <p>{app.studentName}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{app.studentId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.companyName}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.8rem" }}>{app.dateApplied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3>Student Activity</h3>
            <button onClick={() => navigate("/clo/students")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
              View all
            </button>
          </div>
          <div className="p-3 space-y-2">
            {activityData.slice(0, 6).map((s, i) => (
              <div key={s.studentId || i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status === "green" ? "bg-emerald-500" : s.status === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.85rem" }} className="truncate">{s.studentName}</p>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground">Last log: {s.daysSinceLog}d ago</p>
                </div>
                {s.status === "red" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-2" /> Warning
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-2" /> Flagged
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3>Recent Notifications</h3>
          <button onClick={() => navigate("/clo/communications")} className="text-primary hover:underline" style={{ fontSize: "0.8rem" }}>
            View all
          </button>
        </div>
        <div className="divide-y divide-border">
          {notifications.slice(0, 4).map((n) => (
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