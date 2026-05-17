import { useState } from "react";
import { useAppContext } from "../../lib/context";
import { departments } from "../../lib/mock-data";
import { getGradePoint } from "../../services/grade-service";
import { Download, FileText, TrendingUp, BarChart3, Users, GraduationCap, Building2 } from "lucide-react";
import { exportToCSV } from "../../lib/csv-export";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { toast } from "sonner";
import type { ExtendedRole } from "../../services/auth-service";

interface Props {
  viewRole: ExtendedRole;
}

type ReportTab = "overview" | "placement" | "grades" | "companies";

export function ReportsPage({ viewRole }: Props) {
  const { user, store } = useAppContext();
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const department = (viewRole === "dlo" || viewRole === "hod") ? user?.department : undefined;

  const apps = department
    ? store.applications.filter((a) => a.department === department)
    : store.applications;

  const companies = department
    ? store.companies.filter((c) => c.department === department)
    : store.companies;

  // Overview stats
  const totalApps = apps.length;
  const activeStudents = apps.filter((a) => a.status === "Active").length;
  const completedStudents = apps.filter((a) => a.status === "Completed").length;
  const placementRate = totalApps > 0 ? Math.round(((activeStudents + completedStudents) / totalApps) * 100) : 0;
  const approvedCompanies = companies.filter((c) => c.status === "Approved").length;

  // Placement rate by department
  const placementByDept = departments
    .map((d) => {
      const total = store.applications.filter((a) => a.department === d && (!department || d === department)).length;
      const placed = store.applications.filter((a) => a.department === d && ["Active", "Completed"].includes(a.status) && (!department || d === department)).length;
      return { name: d.split(" ")[0], rate: total ? Math.round((placed / total) * 100) : 0, total, placed };
    })
    .filter((d) => d.total > 0);

  // Status distribution
  const statusData = [
    { name: "Active", value: activeStudents, color: "#3B82F6" },
    { name: "Pending", value: apps.filter((a) => a.status === "Pending").length, color: "#F59E0B" },
    { name: "Completed", value: completedStudents, color: "#8B5CF6" },
    { name: "Approved", value: apps.filter((a) => a.status === "Approved").length, color: "#10B981" },
    { name: "Co. Accepted", value: apps.filter((a) => a.status === "Company Accepted").length, color: "#14B8A6" },
    { name: "Rejected", value: apps.filter((a) => a.status === "Rejected").length, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Company by industry
  const companyByIndustry = [...new Set(companies.filter((c) => c.status === "Approved").map((c) => c.industry))].map((ind) => ({
    name: ind,
    count: companies.filter((c) => c.industry === ind && c.status === "Approved").length,
  })).sort((a, b) => b.count - a.count);

  // Grade distribution
  const gradeLetters = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];
  const gradeDistribution = gradeLetters.map((g) => ({
    grade: g,
    count: apps.filter((a) => a.grade === g).length,
  })).filter((g) => g.count > 0);

  // Department radar data
  const radarData = departments.map((d) => {
    const dApps = store.applications.filter((a) => a.department === d);
    const placed = dApps.filter((a) => ["Active", "Completed"].includes(a.status)).length;
    const graded = dApps.filter((a) => a.grade).length;
    return {
      dept: d.split(" ")[0],
      applications: dApps.length,
      placements: placed,
      graded,
    };
  }).filter((d) => d.applications > 0);

  // Supervisor workload
  const supervisorWorkload = [...new Set(apps.filter((a) => a.supervisorAssigned).map((a) => a.supervisorAssigned!))].map((name) => ({
    name: name.split(" ").pop() || name,
    students: apps.filter((a) => a.supervisorAssigned === name && a.status === "Active").length,
  })).sort((a, b) => b.students - a.students);

  // Pre-built reports
  const reports = [
    { name: "Placement Summary Report", desc: "Overall placement rates and statistics by department", format: "PDF", category: "placement" },
    { name: "Company Engagement Report", desc: "Companies involved per term with student counts", format: "CSV", category: "companies" },
    { name: "Grade Distribution Report", desc: "Grade breakdown by department and supervisor", format: "PDF", category: "grades" },
    { name: "Supervisor Workload Report", desc: "Student-to-supervisor ratios and load analysis", format: "CSV", category: "placement" },
    { name: "Student Activity Report", desc: "Logbook completion rates and attendance tracking", format: "PDF", category: "placement" },
    { name: "Term Comparison Report", desc: "Compare metrics across multiple internship terms", format: "PDF", category: "overview" },
    { name: "Inactive Students Report", desc: "Students with 3+ days without logbook entries", format: "CSV", category: "placement" },
    { name: "Company Approval Timeline", desc: "Time from submission to approval/rejection", format: "CSV", category: "companies" },
  ];

  const tabs: { key: ReportTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "placement", label: "Placements", icon: GraduationCap },
    { key: "grades", label: "Grades", icon: FileText },
    { key: "companies", label: "Companies", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {viewRole === "clo" ? "Institution-wide analytics" : viewRole === "hod" ? "Department analytics & oversight" : "Department analytics"}
          </p>
        </div>
        <button
          onClick={() => {
            exportToCSV(
              store.applications.map(a => ({ Student: a.studentName, ID: a.studentId, Company: a.companyName, Department: a.department, Status: a.status, Grade: a.grade || "", Supervisor: a.supervisorAssigned || "", Date: a.dateApplied })),
              "full_report_export"
            );
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Download className="w-4 h-4" /> Export All
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Applications", value: totalApps, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "Active Placements", value: activeStudents, icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
          { label: "Completed", value: completedStudents, icon: TrendingUp, color: "text-violet-600 bg-violet-50" },
          { label: "Placement Rate", value: `${placementRate}%`, icon: BarChart3, color: "text-orange-600 bg-orange-50" },
          { label: "Companies", value: approvedCompanies, icon: Building2, color: "text-cyan-600 bg-cyan-50" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{s.label}</p>
              <p style={{ fontSize: "1.15rem" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
            style={{ fontSize: "0.85rem" }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Application Status Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name">
                      {statusData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Department Performance Radar</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dept" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} />
                    <Radar name="Applications" dataKey="applications" stroke="#0B5ED7" fill="#0B5ED7" fillOpacity={0.15} />
                    <Radar name="Placements" dataKey="placements" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supervisor Workload */}
          {supervisorWorkload.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Supervisor Workload</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supervisorWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="students" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="Active Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placement Tab */}
      {activeTab === "placement" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="mb-4">Placement Rate by Department (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={placementByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Rate"]} />
                  <Bar dataKey="rate" fill="#0B5ED7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Detail Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3>Department Placement Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Department</th>
                    <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Total Apps</th>
                    <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Placed</th>
                    <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Rate</th>
                    <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {placementByDept.map((d) => (
                    <tr key={d.name} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{d.name}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{d.total}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{d.placed}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{d.rate}%</td>
                      <td className="px-4 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${d.rate >= 75 ? "bg-emerald-500" : d.rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${d.rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === "grades" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Grade Distribution</h3>
              <div className="h-56">
                {gradeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                    No grades recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Grade Summary</h3>
              <div className="space-y-3">
                {(() => {
                  const graded = apps.filter((a) => a.grade);
                  const avgGPA = graded.length > 0
                    ? (graded.reduce((sum, a) => sum + getGradePoint(a.grade!), 0) / graded.length).toFixed(2)
                    : "N/A";
                  const approved = apps.filter((a) => a.gradeStatus === "Approved").length;
                  const submitted = apps.filter((a) => a.gradeStatus === "Submitted").length;
                  const pendingGrade = apps.filter((a) => a.gradeStatus === "Pending" || (!a.gradeStatus && a.status === "Active")).length;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-violet-50 rounded-lg p-3 text-center">
                          <p style={{ fontSize: "1.5rem" }} className="text-violet-700">{avgGPA}</p>
                          <p className="text-violet-600" style={{ fontSize: "0.7rem" }}>Average GPA</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p style={{ fontSize: "1.5rem" }} className="text-blue-700">{graded.length}</p>
                          <p className="text-blue-600" style={{ fontSize: "0.7rem" }}>Graded Students</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "Approved (Final)", value: approved, color: "bg-emerald-500" },
                          { label: "Submitted (Pending Review)", value: submitted, color: "bg-amber-500" },
                          { label: "Not Yet Graded", value: pendingGrade, color: "bg-gray-300" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                              <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{item.label}</span>
                            </div>
                            <span style={{ fontSize: "0.85rem" }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Approved Companies by Industry</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyByIndustry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#14B8A6" radius={[0, 6, 6, 0]} name="Companies" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-4">Company Status Breakdown</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Approved", value: companies.filter((c) => c.status === "Approved").length, color: "#10B981" },
                        { name: "Pending", value: companies.filter((c) => c.status === "Pending").length, color: "#F59E0B" },
                        { name: "Rejected", value: companies.filter((c) => c.status === "Rejected").length, color: "#EF4444" },
                      ].filter((d) => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name"
                    >
                      {[
                        { name: "Approved", value: companies.filter((c) => c.status === "Approved").length, color: "#10B981" },
                        { name: "Pending", value: companies.filter((c) => c.status === "Pending").length, color: "#F59E0B" },
                        { name: "Rejected", value: companies.filter((c) => c.status === "Rejected").length, color: "#EF4444" },
                      ].filter((d) => d.value > 0).map((entry) => (
                        <Cell key={`cc-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Companies by Student Count */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3>Top Companies by Student Placements</h3>
            </div>
            <div className="divide-y divide-border">
              {companies
                .filter((c) => c.status === "Approved")
                .map((c) => ({
                  ...c,
                  studentCount: store.applications.filter((a) => a.companyId === c.id && ["Active", "Completed"].includes(a.status)).length,
                }))
                .sort((a, b) => b.studentCount - a.studentCount)
                .slice(0, 6)
                .map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.85rem" }}>{c.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{c.industry} · {c.department.split(" ")[0]}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full" style={{ fontSize: "0.75rem" }}>
                      {c.studentCount} student{c.studentCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Downloadable Reports */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3>Downloadable Reports</h3>
          <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{reports.length} available</span>
        </div>
        <div className="divide-y divide-border">
          {reports
            .filter((r) => activeTab === "overview" || r.category === activeTab)
            .map((r, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p style={{ fontSize: "0.85rem" }}>{r.name}</p>
                    <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toast.success(`${r.name} downloaded as ${r.format}.`)}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center gap-1.5 text-muted-foreground shrink-0"
                  style={{ fontSize: "0.8rem" }}
                >
                  <Download className="w-3.5 h-3.5" /> {r.format}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}