import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import { StatCard } from "../../components/stat-card";
import { apiClient } from "../../lib/api-client";
import type { ApplicationResponse, CompanyResponse } from "../../types/api";
import { getDepartmentAverageGrade } from "../../services/grade-service";
import { getConfigForEditing } from "../../services/grading-service";
import { Settings, AlertCircle } from "lucide-react";
import { checkInactiveStudents } from "../../services/logbook-service";
import {
  Users, TrendingUp, Briefcase, FileCheck2, AlertTriangle,
  GraduationCap, Building2, ClipboardCheck, BarChart3, BookMarked,
  MapPin, CheckCircle2, Clock, ArrowRight, Download, Eye
} from "lucide-react";
import { useNavigate } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function HODDashboard() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const dept = user?.department || "";

  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [allCompanies, setAllCompanies] = useState<CompanyResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiClient.getApplications(), apiClient.getCompanies()]).then(([appsRes, cosRes]) => {
      if (cancelled) return;
      if (appsRes.success) setApplications(appsRes.data);
      if (cosRes.success) setAllCompanies(cosRes.data);
    });
    return () => { cancelled = true; };
  }, []);

  const deptApps = applications.filter((a) => a.department === dept);
  const activeApps = deptApps.filter((a) => a.status === "Active");
  const completedApps = deptApps.filter((a) => a.status === "Completed");
  const pendingApps = deptApps.filter((a) => a.status === "Pending");
  const approvedApps = deptApps.filter((a) => a.status === "Approved" || a.status === "Company Accepted");

  // Companies
  const deptCompanyIds = [...new Set(deptApps.map((a) => a.companyId))];
  const deptCompanies = allCompanies.filter((c) => deptCompanyIds.includes(c.id));

  // Grades
  const gradedApps = deptApps.filter((a) => a.grade);
  const pendingGrades = deptApps.filter((a) => a.gradeStatus === "Submitted");
  const approvedGrades = deptApps.filter((a) => a.gradeStatus === "Approved");
  const avgGrade = getDepartmentAverageGrade(dept);

  // Supervisors
  const supervisorNames = [...new Set(deptApps.map((a) => a.supervisorAssigned).filter(Boolean))];

  // Flagged students
  const flaggedStudents = checkInactiveStudents().filter((s) => s.status !== "green");

  // Grading config status for this department
  const gradingConfig = getConfigForEditing(dept);
  const configPendingApproval = gradingConfig.status === "pending_approval";

  // Chart data: applications by status
  const statusData = [
    { name: "Active", value: activeApps.length, color: "#0B5ED7" },
    { name: "Completed", value: completedApps.length, color: "#10B981" },
    { name: "Pending", value: pendingApps.length, color: "#F59E0B" },
    { name: "Approved", value: approvedApps.length, color: "#6366F1" },
  ].filter((d) => d.value > 0);

  // Grade distribution
  const gradeDistribution = ["A", "B+", "B", "C+", "C", "D", "F"].map((g) => ({
    grade: g,
    count: gradedApps.filter((a) => a.grade === g).length,
  })).filter((g) => g.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>HOD Dashboard</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Department of {dept} · Overview
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/hod/approvals")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <ClipboardCheck className="w-4 h-4" /> Approvals
            {pendingGrades.length > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded-md" style={{ fontSize: "0.7rem" }}>
                {pendingGrades.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/hod/reports")}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <Download className="w-4 h-4" /> Reports
          </button>
        </div>
      </div>

      {/* Grading Config Approval Banner */}
      {configPendingApproval && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-amber-900">Grading Configuration Awaiting Your Approval</h4>
              <p className="text-amber-800 mt-0.5" style={{ fontSize: "0.8rem" }}>
                The DLO has submitted a new grading configuration for {dept}. Review and approve it to lock weights for the term.
              </p>
              <p className="text-amber-700 mt-1" style={{ fontSize: "0.7rem" }}>
                Submitted by {gradingConfig.submittedForApprovalBy ?? "DLO"}
                {gradingConfig.submittedForApprovalAt && ` · ${new Date(gradingConfig.submittedForApprovalAt).toLocaleString()}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/hod/settings")}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 shrink-0"
            style={{ fontSize: "0.8rem" }}
          >
            <Settings className="w-4 h-4" /> Review Config
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Attachments"
          value={activeApps.length}
          subtitle={`${deptApps.length} total this term`}
          icon={<Briefcase className="w-4 h-4" />}
          highlight
        />
        <StatCard
          title="Companies Engaged"
          value={deptCompanies.length}
          subtitle={`${deptCompanies.filter((c) => c.status === "Approved").length} approved`}
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          title="Academic Supervisors"
          value={supervisorNames.length}
          subtitle={`${deptApps.filter((a) => a.supervisorAssigned).length} students assigned`}
          icon={<GraduationCap className="w-4 h-4" />}
        />
        <StatCard
          title="Department Avg Grade"
          value={avgGrade}
          subtitle={`${gradedApps.length} graded · ${approvedGrades.length} approved`}
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      {/* Alerts */}
      {(pendingGrades.length > 0 || flaggedStudents.length > 0 || pendingApps.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-amber-800">Attention Required</h4>
          </div>
          <div className="flex gap-3 flex-wrap">
            {pendingGrades.length > 0 && (
              <button
                onClick={() => navigate("/hod/approvals")}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                style={{ fontSize: "0.8rem" }}
              >
                <ClipboardCheck className="w-4 h-4" /> {pendingGrades.length} grade{pendingGrades.length > 1 ? "s" : ""} awaiting approval
              </button>
            )}
            {flaggedStudents.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg" style={{ fontSize: "0.8rem" }}>
                <AlertTriangle className="w-4 h-4" /> {flaggedStudents.length} inactive student{flaggedStudents.length > 1 ? "s" : ""}
              </div>
            )}
            {pendingApps.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg" style={{ fontSize: "0.8rem" }}>
                <Clock className="w-4 h-4" /> {pendingApps.length} pending application{pendingApps.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="mb-4">Application Status Distribution</h3>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p style={{ fontSize: "0.85rem" }}>No application data available.</p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Grade Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="mb-4">Grade Distribution</h3>
          {gradeDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p style={{ fontSize: "0.85rem" }}>No grades submitted yet.</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                  <Bar dataKey="count" fill="#0B5ED7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supervisor Load */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3>Academic Supervisors</h3>
          </div>
          <div className="divide-y divide-border">
            {supervisorNames.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                No supervisors assigned yet.
              </div>
            ) : (
              supervisorNames.map((name, i) => {
                const assigned = deptApps.filter((a) => a.supervisorAssigned === name);
                const graded = assigned.filter((a) => a.grade);
                return (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ fontSize: "0.75rem" }}>
                        {name!.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.85rem" }}>{name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                          {assigned.length} student{assigned.length !== 1 ? "s" : ""} · {graded.length} graded
                        </p>
                      </div>
                    </div>
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${assigned.length > 0 ? (graded.length / assigned.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3>Department Students</h3>
            <button
              onClick={() => navigate("/hod/students")}
              className="text-primary hover:underline flex items-center gap-1"
              style={{ fontSize: "0.8rem" }}
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {deptApps.slice(0, 5).map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: "0.85rem" }}>{app.studentName}</p>
                    <span className={`px-2 py-0.5 rounded ${
                      app.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                      app.status === "Completed" ? "bg-blue-100 text-blue-700" :
                      app.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`} style={{ fontSize: "0.6rem" }}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                    {app.studentId} · {app.companyName}
                  </p>
                </div>
                <div className="text-right">
                  {app.grade ? (
                    <span className="px-2.5 py-0.5 bg-secondary rounded" style={{ fontSize: "0.85rem" }}>{app.grade}</span>
                  ) : (
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>No grade</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Grades Quick View */}
      {pendingGrades.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Grades Pending Your Approval
            </h3>
            <button
              onClick={() => navigate("/hod/approvals")}
              className="text-primary hover:underline flex items-center gap-1"
              style={{ fontSize: "0.8rem" }}
            >
              Review all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {pendingGrades.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700" style={{ fontSize: "0.75rem" }}>
                    {app.studentName.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.85rem" }}>{app.studentName}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                      {app.studentId} · By: {app.supervisorAssigned}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-secondary rounded-lg" style={{ fontSize: "1rem" }}>
                    {app.grade}
                  </span>
                  <button
                    onClick={() => navigate("/hod/approvals")}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}