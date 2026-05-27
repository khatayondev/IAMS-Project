import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import { StatusBadge } from "../../components/status-badge";
import { StatCard } from "../../components/stat-card";
import { apiClient } from "../../lib/api-client";
import type { ApplicationResponse } from "../../types/api";
import { getStudentLogbook } from "../../services/logbook-service";
import { getAttendanceRecords } from "../../services/attendance-service";
import { getOverdueWeeklyRubrics } from "../../services/grading-service";
import {
  GraduationCap, BookMarked, ClipboardCheck, Clock, CheckCircle2, AlertTriangle,
  MapPin, TrendingUp, Calendar
} from "lucide-react";
import { useNavigate } from "react-router";

export function SupervisorDashboard() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  const [assignedStudents, setAssignedStudents] = useState<ApplicationResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiClient.getApplications({ status: "Active" }).then((res) => {
      if (!cancelled && res.success) setAssignedStudents(res.data);
    });
    return () => { cancelled = true; };
  }, []);

  const overdueRubrics = getOverdueWeeklyRubrics({});

  // Aggregate metrics
  const totalStudents = assignedStudents.length;
  const allLogs = assignedStudents.flatMap((a) => getStudentLogbook(a.studentId));
  const pendingLogs = allLogs.filter((l) => l.approvalStatus === "Pending").length;
  const approvedLogs = allLogs.filter((l) => l.approvalStatus === "Approved").length;
  const revisionLogs = allLogs.filter((l) => l.approvalStatus === "Revision Requested").length;
  const totalLogs = allLogs.length;

  // Attendance summary
  const attendanceRecords = assignedStudents.flatMap((a) =>
    getAttendanceRecords({ studentId: a.studentId })
  );
  const pendingVerification = attendanceRecords.filter(
    (r) => r.verificationStatus === "Pending Verification"
  ).length;

  // Per-student stats
  const studentStats = assignedStudents.map((app) => {
    const logs = getStudentLogbook(app.studentId);
    const pending = logs.filter((l) => l.approvalStatus === "Pending").length;
    const approved = logs.filter((l) => l.approvalStatus === "Approved").length;
    const lastLog = logs.sort((a, b) => b.date.localeCompare(a.date))[0];
    const today = new Date();
    const lastLogDate = lastLog ? new Date(lastLog.date) : null;
    const daysSinceLog = lastLogDate
      ? Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      ...app,
      totalLogs: logs.length,
      pendingLogs: pending,
      approvedLogs: approved,
      lastLogDate: lastLog?.date || "N/A",
      daysSinceLog,
      activityStatus: daysSinceLog <= 1 ? "active" : daysSinceLog <= 3 ? "warning" : "inactive",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1>Industry Supervisor Portal</h1>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Welcome, {user?.name}. You have {totalStudents} student{totalStudents !== 1 ? "s" : ""} assigned.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p style={{ fontSize: "0.8rem" }} className="text-blue-800">
          This portal uses tokenized access — no password required. Review student logbooks, verify attendance check-ins, and submit evaluations from here.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={totalStudents}
          subtitle="Currently active"
          icon={<GraduationCap className="w-4 h-4" />}
          highlight
        />
        <StatCard
          title="Pending Log Reviews"
          value={pendingLogs}
          subtitle={`${approvedLogs} approved · ${revisionLogs} revision`}
          icon={<BookMarked className="w-4 h-4" />}
        />
        <StatCard
          title="Total Log Entries"
          value={totalLogs}
          subtitle="Across all students"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          title="Attendance Pending"
          value={pendingVerification}
          subtitle="Manual check-ins to verify"
          icon={<MapPin className="w-4 h-4" />}
        />
      </div>

      {/* Weekly Rubric reminders — shown when one or more weeks have ended without a submission */}
      {overdueRubrics.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h4 className="text-amber-800">
                {overdueRubrics.length} weekly rubric{overdueRubrics.length > 1 ? "s" : ""} pending
              </h4>
            </div>
            <span className="text-amber-700" style={{ fontSize: "0.75rem" }}>
              Each week ends on Sunday — please record the previous week before Friday of the next.
            </span>
          </div>
          <div className="space-y-2">
            {overdueRubrics.slice(0, 4).map((r) => (
              <div
                key={`${r.applicationId}-${r.weekNumber}`}
                className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg p-3"
              >
                <div className="min-w-0">
                  <div className="text-[#1a1a2e] truncate" style={{ fontSize: "0.85rem" }}>
                    {r.studentName} · Week {r.weekNumber}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                    Week ended {new Date(r.weekEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {" · "}{r.daysOverdue} day{r.daysOverdue !== 1 ? "s" : ""} overdue
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(`/supervisor/evaluate?student=${r.applicationId}&tab=weekly&week=${r.weekNumber}`)
                  }
                  className="shrink-0 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  style={{ fontSize: "0.8rem" }}
                >
                  Fill Now
                </button>
              </div>
            ))}
            {overdueRubrics.length > 4 && (
              <button
                onClick={() => navigate("/supervisor/evaluate?tab=weekly")}
                className="w-full text-center py-1.5 text-amber-800 hover:underline"
                style={{ fontSize: "0.8rem" }}
              >
                View all {overdueRubrics.length} pending →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {(pendingLogs > 0 || pendingVerification > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-amber-800">Actions Required</h4>
          </div>
          <div className="flex gap-3 flex-wrap">
            {pendingLogs > 0 && (
              <button
                onClick={() => navigate("/supervisor/logbooks")}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                style={{ fontSize: "0.85rem" }}
              >
                <BookMarked className="w-4 h-4" /> Review {pendingLogs} Pending Log{pendingLogs > 1 ? "s" : ""}
              </button>
            )}
            {pendingVerification > 0 && (
              <button
                onClick={() => navigate("/supervisor/attendance")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                style={{ fontSize: "0.85rem" }}
              >
                <MapPin className="w-4 h-4" /> Verify {pendingVerification} Check-In{pendingVerification > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Students Overview */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3>Assigned Students</h3>
          <div className="flex gap-4 text-muted-foreground" style={{ fontSize: "0.7rem" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Inactive</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {studentStats.map((student) => (
            <div key={student.id} className="p-5 flex items-start gap-4 hover:bg-secondary/20 transition-colors">
              {/* Avatar with status indicator */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0" style={{ fontSize: "0.85rem" }}>
                  {student.studentName.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                  student.activityStatus === "active" ? "bg-emerald-500" : student.activityStatus === "warning" ? "bg-amber-500" : "bg-red-500"
                }`} />
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontSize: "0.95rem" }} className="text-foreground">{student.studentName}</p>
                  <StatusBadge status={student.status} />
                </div>
                <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground">
                  {student.studentId} · {student.department}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-5 mt-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>{student.totalLogs} entries</span>
                    {student.pendingLogs > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "0.6rem" }}>
                        {student.pendingLogs} pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last log: {student.lastLogDate}</span>
                    {student.daysSinceLog >= 3 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded" style={{ fontSize: "0.6rem" }}>
                        {student.daysSinceLog}d ago
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Acad: {student.supervisorAssigned || "Not assigned"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate("/supervisor/logbooks")}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center gap-1.5 transition-colors"
                  style={{ fontSize: "0.8rem" }}
                >
                  <BookMarked className="w-3.5 h-3.5" /> Logs
                </button>
                <button
                  onClick={() => navigate("/supervisor/evaluate")}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5"
                  style={{ fontSize: "0.8rem" }}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Evaluate
                </button>
              </div>
            </div>
          ))}
          {assignedStudents.length === 0 && (
            <div className="p-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3>No students currently assigned</h3>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                Students will appear here once they are placed at your company.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}