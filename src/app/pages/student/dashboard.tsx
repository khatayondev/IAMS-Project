import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import { apiClient } from "../../lib/api-client";
import { StatusBadge } from "../../components/status-badge";
import { StatCard } from "../../components/stat-card";
import { BookMarked, FileText, Clock, CheckCircle2, Upload, Award, Send, ArrowRight, TrendingUp, Building2, User, MapPin, Calendar, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router";

export function StudentDashboard() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    apiClient.getDashboard("student").then((res) => {
      if (res.success) setDashboard(res.data);
    });
  }, []);

  const activeInternship = dashboard?.active_internship;
  const recentLogbooks: any[] = dashboard?.recent_logbooks ?? [];
  const attendanceSummary = dashboard?.attendance_summary;
  const publishedGrade = dashboard?.published_grade;

  const companyName    = activeInternship?.company?.name ?? "N/A";
  const appStatus      = activeInternship?.status ?? "none";
  const supervisorName = activeInternship?.academic_supervisor?.user?.name
    ?? activeInternship?.academicSupervisor?.user?.name
    ?? null;
  const startDate      = activeInternship?.start_date ?? activeInternship?.created_at ?? "";

  const isDone = (statuses: string[]) => statuses.includes(appStatus);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.studentId} · {user?.department}
        </p>
      </div>

      {/* Active Internship Spotlight or Apply CTA */}
      {activeInternship ? (
        <div className="space-y-3">
          {/* Main Internship Card */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <h2 className="text-sm font-semibold">Active Internship</h2>
                </div>
                <p className="text-xl font-bold text-foreground truncate">{companyName}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {activeInternship?.company?.industry ?? "Industrial Attachment"}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={appStatus} />
              </div>
            </div>

            {/* Internship Details - Stacked on mobile */}
            <div className="space-y-2 pt-2">
              {/* Start Date */}
              {startDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Start Date</p>
                    <p className="font-medium text-sm">{new Date(startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Department */}
              {activeInternship?.student?.department && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Department</p>
                    <p className="font-medium text-sm">{activeInternship.student.department}</p>
                  </div>
                </div>
              )}

              {/* Company Location */}
              {activeInternship?.company?.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium text-sm truncate">{activeInternship.company.location}</p>
                  </div>
                </div>
              )}

              {/* Company Contact */}
              {activeInternship?.company?.contact_person_email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Company Contact</p>
                    <p className="font-medium text-xs truncate">{activeInternship.company.contact_person_email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Supervisors Section */}
            {(supervisorName || activeInternship?.industry_supervisor?.user?.name) && (
              <div className="pt-2 border-t border-primary/10 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supervisors</p>
                <div className="space-y-2">
                  {/* Academic Supervisor */}
                  {supervisorName && (
                    <div className="bg-white/50 dark:bg-white/5 rounded-lg p-2 border border-primary/10">
                      <div className="flex items-start gap-2">
                        <User className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Academic</p>
                          <p className="font-medium text-xs">{supervisorName}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Industry Supervisor */}
                  {activeInternship?.industry_supervisor?.user?.name && (
                    <div className="bg-white/50 dark:bg-white/5 rounded-lg p-2 border border-primary/10">
                      <div className="flex items-start gap-2">
                        <User className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Industry</p>
                          <p className="font-medium text-xs">{activeInternship.industry_supervisor.user.name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/student/logbook")}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-xs font-medium flex items-center gap-1.5"
              >
                <BookMarked className="w-3 h-3" />
                Logbook
              </button>
              <button
                onClick={() => navigate("/student/attendance")}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-medium"
              >
                Attendance
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800 rounded-2xl p-6 text-center space-y-3">
          <Send className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">No Active Internship</h2>
            <p className="text-amber-700 dark:text-amber-300 mt-1" style={{ fontSize: "0.9rem" }}>
              Ready to start your industrial attachment? Submit an application to get started.
            </p>
          </div>
          <button
            onClick={() => navigate("/student/applications")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Key Metrics - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          title="Logbook Entries"
          value={recentLogbooks.length}
          subtitle={recentLogbooks.length > 0 ? `Latest: ${recentLogbooks[0]?.entry_date ? new Date(recentLogbooks[0].entry_date).toLocaleDateString() : "—"}` : "Start logging your daily work"}
          icon={<BookMarked className="w-4 h-4" />}
          highlight={recentLogbooks.length === 0}
        />
        <StatCard
          title="Attendance Rate"
          value={attendanceSummary ? `${attendanceSummary.attendance_rate}%` : "—"}
          subtitle={attendanceSummary ? `${attendanceSummary.present} present · ${attendanceSummary.absent} absent` : "No attendance data yet"}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="My Grade"
          value={publishedGrade ? `${publishedGrade.total_score?.toFixed(1) ?? "—"}%` : "Pending"}
          subtitle={publishedGrade ? `${publishedGrade.letter_grade ?? "—"}` : "Check back after evaluation"}
          icon={<Award className="w-4 h-4" />}
          highlight={!!publishedGrade}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/student/logbook")}
            className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/40 transition-all group flex flex-col items-center text-center"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors mb-2">
              <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-xs">Logbook</h4>
            <p className="text-muted-foreground text-xs mt-0.5 leading-tight">Activities</p>
          </button>

          <button
            onClick={() => navigate("/student/evaluation")}
            className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/40 transition-all group flex flex-col items-center text-center"
          >
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors mb-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-medium text-xs">Grade</h4>
            <p className="text-muted-foreground text-xs mt-0.5 leading-tight">{publishedGrade ? "View" : "Pending"}</p>
          </button>

          <button
            onClick={() => navigate("/student/documents")}
            className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/40 transition-all group flex flex-col items-center text-center"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors mb-2">
              <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-medium text-xs">Documents</h4>
            <p className="text-muted-foreground text-xs mt-0.5 leading-tight">Letters</p>
          </button>

          <button
            onClick={() => navigate("/student/applications")}
            className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/40 transition-all group flex flex-col items-center text-center"
          >
            <div className="p-2 bg-orange-100 dark:bg-orange-950/40 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors mb-2">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="font-medium text-xs">Apply</h4>
            <p className="text-muted-foreground text-xs mt-0.5 leading-tight">Applications</p>
          </button>
        </div>
      </div>

      {/* Recent Logbook Entries */}
      {recentLogbooks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-blue-600" />
                Recent Logbook Entries
              </h3>
              <p className="text-muted-foreground text-sm mt-0.5">{recentLogbooks.length} total entries</p>
            </div>
            <button
              onClick={() => navigate("/student/logbook")}
              className="text-primary hover:opacity-70 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {recentLogbooks.slice(0, 5).map((entry: any, idx: number) => (
              <div
                key={entry.id}
                className="p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "—"}</p>
                      <p style={{ fontSize: "0.8rem" }} className="text-muted-foreground line-clamp-1">
                        {entry.activities_description ?? entry.activities ?? "No activities recorded"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={entry.status ?? "draft"} />
                  </div>
                </div>
                {entry.skills_learned && (
                  <div className="flex flex-wrap gap-1 ml-13">
                    {String(entry.skills_learned).split(",").slice(0, 3).map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary/60 hover:bg-secondary rounded text-secondary-foreground text-xs font-medium transition-colors">
                        {s.trim()}
                      </span>
                    ))}
                    {String(entry.skills_learned).split(",").length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{String(entry.skills_learned).split(",").length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Timeline */}
      {activeInternship && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Internship Progress
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Application Submitted",   done: true },
              { label: "Application Approved",    done: isDone(["approved", "active", "completed"]) },
              { label: "Supervisor Assigned",     done: !!supervisorName, date: supervisorName ?? undefined },
              { label: "Internship Active",       done: isDone(["active", "completed"]) },
              { label: "Completed",               done: isDone(["completed"]) },
            ].map((step, i, arr) => (
              <div key={i} className="relative">
                {i < arr.length - 1 && (
                  <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${step.done ? "bg-primary" : "bg-muted"}`} />
                )}
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-medium text-sm ${
                    step.done
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground border-2 border-muted"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="pt-0.5">
                    <p className={`font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && <p style={{ fontSize: "0.8rem" }} className="text-muted-foreground mt-1">{step.date}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
