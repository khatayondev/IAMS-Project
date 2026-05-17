import { toast } from "sonner";
import type { ExtendedRole } from "../../services/auth-service";
import { exportToCSV } from "../../lib/csv-export";
import { useState } from "react";
import { StatusBadge } from "../../components/status-badge";
import { useAppContext } from "../../lib/context";
import { departments } from "../../lib/mock-data";
import {
  approveCompiledGrade,
  requestGradeRevision,
  getCompiledGrade,
  hasActiveConfig,
} from "../../services/grading-service";
import { AlertTriangle } from "lucide-react";
import { GradeBreakdownCard } from "../../components/grading/grade-breakdown-card";
import { WeeklyRubricHistory } from "../../components/grading/weekly-rubric-history";
import { CheckCircle2, RotateCcw, Search, Download, FileText, Clock, BarChart3, Eye, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { GradingActor } from "../../types/grading";

interface Props {
  viewRole: ExtendedRole;
}

type GradeTab = "all" | "submitted" | "approved" | "pending";

export function GradesPage({ viewRole }: Props) {
  const { user, store } = useAppContext();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<GradeTab>("all");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const department = viewRole === "dlo" ? user?.department : undefined;
  // dependency reads to keep the page reactive when grades update
  const _ = store.compiledGrades.length + store.applications.length;

  const gradeApps = store.applications.filter((a) => {
    const hasGradeInfo = a.status === "Completed" || a.gradeStatus || getCompiledGrade(a.id);
    const matchDept = department ? a.department === department : (deptFilter === "All" || a.department === deptFilter);
    return hasGradeInfo && matchDept;
  });

  const filtered = gradeApps.filter((a) => {
    const matchSearch = search === "" ||
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.studentId.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "all" ||
      (activeTab === "submitted" && a.gradeStatus === "Submitted") ||
      (activeTab === "approved" && a.gradeStatus === "Approved") ||
      (activeTab === "pending" && (a.gradeStatus === "Pending" || !a.gradeStatus));
    return matchSearch && matchTab;
  });

  const submittedCount = gradeApps.filter((a) => a.gradeStatus === "Submitted").length;
  const approvedCount = gradeApps.filter((a) => a.gradeStatus === "Approved").length;
  const pendingCount = gradeApps.filter((a) => a.gradeStatus === "Pending" || !a.gradeStatus).length;

  // Score distribution buckets (percent only — no letter grades per Q7)
  const buckets = [
    { label: "0–49", min: 0, max: 50 },
    { label: "50–59", min: 50, max: 60 },
    { label: "60–69", min: 60, max: 70 },
    { label: "70–79", min: 70, max: 80 },
    { label: "80–89", min: 80, max: 90 },
    { label: "90–100", min: 90, max: 101 },
  ];
  const scoreDistribution = buckets
    .map((b) => ({
      bucket: b.label,
      count: gradeApps.filter((a) => {
        const g = getCompiledGrade(a.id);
        const p = g?.finalPercent;
        return p !== null && p !== undefined && p >= b.min && p < b.max;
      }).length,
    }))
    .filter((b) => b.count > 0);

  const finalised = gradeApps
    .map((a) => getCompiledGrade(a.id))
    .filter((g): g is NonNullable<typeof g> => !!g && g.finalPercent !== null);
  const avgPercent = finalised.length > 0
    ? (finalised.reduce((s, g) => s + (g.finalPercent || 0), 0) / finalised.length).toFixed(1)
    : "N/A";

  const actor: GradingActor = {
    id: user?.id ?? "u",
    name: user?.name ?? "System",
    role: (user?.role as any) ?? "dlo",
    department,
  };

  const handleApprove = (id: string) => {
    const r = approveCompiledGrade(id, actor);
    r.success ? toast.success(r.message) : toast.error(r.message);
  };

  const handleRevision = (id: string) => {
    const r = requestGradeRevision(id, "Grade needs review", actor);
    r.success ? toast.info(r.message) : toast.error(r.message);
  };

  const detail = selectedApp ? store.applications.find((a) => a.id === selectedApp) : null;
  const detailGrade = detail ? getCompiledGrade(detail.id) : null;

  const tabCounts = {
    all: gradeApps.length,
    submitted: submittedCount,
    approved: approvedCount,
    pending: pendingCount,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Grade Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Review and approve final attachment grades · {gradeApps.length} records
          </p>
        </div>
        <button
          onClick={() => {
            exportToCSV(
              gradeApps.map(a => {
                const g = getCompiledGrade(a.id);
                return {
                  Student: a.studentName,
                  ID: a.studentId,
                  Company: a.companyName,
                  Department: a.department,
                  "Final %": g?.finalPercent ?? "Pending",
                  Status: a.gradeStatus || "Pending",
                };
              }),
              "grades_export"
            );
          }}
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Download className="w-4 h-4" /> Export Grades
        </button>
      </div>

      {viewRole === "dlo" && department && !hasActiveConfig(department) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800" style={{ fontSize: "0.85rem" }}>
            No approved grading configuration exists for {department}. Final grades cannot be compiled
            until the structure is configured and approved by the HOD — open <strong>Settings → Grading Configuration</strong>.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Finalised", value: finalised.length, color: "text-blue-600 bg-blue-50", icon: FileText },
          { label: "Avg. Score", value: avgPercent === "N/A" ? "N/A" : `${avgPercent}%`, color: "text-violet-600 bg-violet-50", icon: BarChart3 },
          { label: "Submitted", value: submittedCount, color: "text-amber-600 bg-amber-50", icon: Clock },
          { label: "Approved", value: approvedCount, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
          { label: "Pending", value: pendingCount, color: "text-gray-600 bg-gray-50", icon: Eye },
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

      {/* Score Distribution Chart */}
      {scoreDistribution.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-4">Score Distribution</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B5ED7" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {(["all", "submitted", "approved", "pending"] as GradeTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg border transition-colors capitalize flex items-center gap-1 ${
                activeTab === tab ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
              style={{ fontSize: "0.8rem" }}
            >
              {tab}
              <span className={`px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20" : "bg-secondary"}`} style={{ fontSize: "0.65rem" }}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        {viewRole === "clo" && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-card"
            style={{ fontSize: "0.85rem" }}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Student</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Company</th>
                  {viewRole === "clo" && <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Department</th>}
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Supervisor</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Final Score</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Status</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const g = getCompiledGrade(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer ${selectedApp === app.id ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedApp(app.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p style={{ fontSize: "0.85rem" }}>{app.studentName}</p>
                          <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground">{app.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.companyName}</td>
                      {viewRole === "clo" && <td className="px-4 py-3" style={{ fontSize: "0.8rem" }}>{app.department.split(" ")[0]}</td>}
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.supervisorAssigned || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-lg ${g?.finalPercent !== null && g?.finalPercent !== undefined ? "bg-blue-50 text-blue-700" : "bg-secondary text-muted-foreground"}`} style={{ fontSize: "0.85rem" }}>
                          {g?.finalPercent !== null && g?.finalPercent !== undefined ? `${g.finalPercent.toFixed(1)}%` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.gradeStatus || "Pending"} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {app.gradeStatus === "Submitted" && (
                            <>
                              <button onClick={() => handleApprove(app.id)} className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600" title="Approve">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleRevision(app.id)} className="p-1.5 rounded-md hover:bg-amber-100 text-amber-600" title="Request Revision">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {app.gradeStatus === "Approved" && (
                            <span className="text-emerald-600 flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Final
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={viewRole === "clo" ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                      No grades found for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {detail && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
            <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3>Grade Details</h3>
                  <button onClick={() => setSelectedApp(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {detailGrade ? (
                  <GradeBreakdownCard compiled={detailGrade} studentName={detail.studentName} />
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No components have been submitted yet for this student.
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[#1a1a2e]">Weekly Progress Record</h4>
                    <span className="text-xs text-gray-500">Industrial Supervisor — qualitative</span>
                  </div>
                  <WeeklyRubricHistory applicationId={detail.id} />
                </div>

                {detail.gradeStatus === "Submitted" && detailGrade?.finalPercent !== null && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <button
                      onClick={() => handleApprove(detail.id)}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Final Grade
                    </button>
                    <button
                      onClick={() => handleRevision(detail.id)}
                      className="w-full py-2 border border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 flex items-center justify-center gap-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <RotateCcw className="w-4 h-4" /> Request Revision
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
