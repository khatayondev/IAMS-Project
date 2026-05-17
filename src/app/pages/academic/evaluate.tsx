import { useState } from "react";
import { useAppContext } from "../../lib/context";
import { getStudentLogbook } from "../../services/logbook-service";
import { getAttendanceRecords } from "../../services/attendance-service";
import { getCompiledGrade, getActiveConfig } from "../../services/grading-service";
import { updateApplication, addNotification, addAuditLog } from "../../lib/store";
import { GradeBreakdownCard } from "../../components/grading/grade-breakdown-card";
import {
  FileText, Eye, CheckCircle2, MessageSquare, ChevronLeft, Calendar,
  BookMarked, MapPin, User, Building2, Clock, Save, Star,
  AlertTriangle, BarChart3, Send, X, GraduationCap, ClipboardCheck
} from "lucide-react";
import { toast } from "sonner";

type Tab = "logbook" | "attendance" | "evaluation" | "visits";

interface SiteVisitNote {
  id: string;
  date: string;
  observations: string;
  studentEngagement: number; // 1-5
  companyFeedback: string;
  recommendations: string;
}

interface EvaluationForm {
  technicalSkills: number;
  problemSolving: number;
  communication: number;
  professionalism: number;
  logbookQuality: number;
  reportQuality: number;
  supervisorRelationship: number;
  overallPerformance: number;
  strengths: string;
  improvements: string;
  generalComments: string;
  recommendation: string;
}

const defaultEvaluation: EvaluationForm = {
  technicalSkills: 0,
  problemSolving: 0,
  communication: 0,
  professionalism: 0,
  logbookQuality: 0,
  reportQuality: 0,
  supervisorRelationship: 0,
  overallPerformance: 0,
  strengths: "",
  improvements: "",
  generalComments: "",
  recommendation: "",
};

const criteria = [
  { key: "technicalSkills" as const, label: "Technical Skills Acquired", maxScore: 15, description: "Relevance and depth of skills gained during attachment" },
  { key: "problemSolving" as const, label: "Problem Solving & Initiative", maxScore: 15, description: "Ability to identify and solve problems independently" },
  { key: "communication" as const, label: "Communication Skills", maxScore: 10, description: "Written and verbal communication effectiveness" },
  { key: "professionalism" as const, label: "Professionalism & Conduct", maxScore: 10, description: "Punctuality, attitude, and professional behavior" },
  { key: "logbookQuality" as const, label: "Logbook Quality", maxScore: 15, description: "Completeness, accuracy, and consistency of daily logs" },
  { key: "reportQuality" as const, label: "Final Report Quality", maxScore: 25, description: "Structure, content depth, and analysis quality" },
  { key: "supervisorRelationship" as const, label: "Supervisor Relationship", maxScore: 5, description: "Relationship with industry and academic supervisors" },
  { key: "overallPerformance" as const, label: "Overall Performance", maxScore: 5, description: "Holistic assessment of the student's attachment experience" },
];

export function AcademicEvaluatePage() {
  const { user, store } = useAppContext();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("logbook");
  const [evaluation, setEvaluation] = useState<EvaluationForm>({ ...defaultEvaluation });
  const [siteVisitNotes, setSiteVisitNotes] = useState<SiteVisitNote[]>([
    {
      id: "sv1",
      date: "2026-04-10",
      observations: "Student is well-integrated into the team. Workstation is set up properly. Company mentor is actively engaged.",
      studentEngagement: 4,
      companyFeedback: "Very satisfied with student performance. Contributes actively to projects.",
      recommendations: "Continue current trajectory. Consider involving student in the upcoming network migration project.",
    },
  ]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [newVisit, setNewVisit] = useState({ date: "", observations: "", studentEngagement: 3, companyFeedback: "", recommendations: "" });

  // Get assigned students
  const assignedStudents = store.applications.filter(
    (a) => (a.status === "Active" || a.status === "Completed") &&
      (a.supervisorAssigned === user?.name || a.department === user?.department)
  );

  const student = assignedStudents.find((s) => s.id === selectedStudent);
  const logbookEntries = student ? getStudentLogbook(student.studentId) : [];
  const attendanceRecords = student ? getAttendanceRecords({ studentId: student.studentId }) : [];

  // Logbook stats
  const approvedCount = logbookEntries.filter((l) => l.approvalStatus === "Approved").length;
  const pendingCount = logbookEntries.filter((l) => l.approvalStatus === "Pending").length;
  const revisionCount = logbookEntries.filter((l) => l.approvalStatus === "Revision Requested").length;

  // Attendance stats
  const verifiedAttendance = attendanceRecords.filter((r) => r.verificationStatus === "Verified").length;

  // Evaluation total
  const totalScore = criteria.reduce((sum, c) => sum + (evaluation[c.key] || 0), 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const getGradeLetter = (score: number) => {
    const pct = (score / maxTotal) * 100;
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C+";
    if (pct >= 45) return "C";
    if (pct >= 40) return "D";
    return "F";
  };

  const handleSubmitEvaluation = () => {
    if (!student) return;
    const grade = getGradeLetter(totalScore);

    updateApplication(student.id, {
      grade,
      gradeStatus: "Submitted",
    });

    addAuditLog({
      id: `al-${Date.now()}`,
      user: user?.name || "",
      action: "Submitted Grade",
      target: `${student.studentName} (${student.studentId})`,
      timestamp: new Date().toISOString(),
      details: `Grade ${grade} (${totalScore}/${maxTotal}) submitted. Pending DLO approval.`,
    });

    addNotification({
      id: `n-${Date.now()}`,
      type: "grade",
      title: "Grade Submitted",
      message: `${user?.name} submitted grade ${grade} for ${student.studentName} (${student.studentId}). Pending DLO approval.`,
      read: false,
      timestamp: new Date().toISOString(),
    });

    toast.success(`Grade ${grade} (${totalScore}/${maxTotal}) submitted for ${student.studentName}. DLO will be notified.`);
    setSelectedStudent(null);
    setEvaluation({ ...defaultEvaluation });
    setActiveTab("logbook");
  };

  const handleAddVisitNote = () => {
    const note: SiteVisitNote = {
      id: `sv-${Date.now()}`,
      ...newVisit,
    };
    setSiteVisitNotes((prev) => [note, ...prev]);
    setShowVisitForm(false);
    setNewVisit({ date: "", observations: "", studentEngagement: 3, companyFeedback: "", recommendations: "" });
    toast.success("Site visit note recorded.");
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "logbook", label: "Logbook", icon: BookMarked },
    { key: "attendance", label: "Attendance", icon: MapPin },
    { key: "visits", label: "Site Visits", icon: Building2 },
    { key: "evaluation", label: "Evaluation", icon: ClipboardCheck },
  ];

  // ── STUDENT LIST VIEW ──
  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Evaluate & Monitor Students</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Review logbooks, track attendance, record site visits, and submit final evaluations
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3>Select a Student to Review</h3>
            <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              {assignedStudents.length} student{assignedStudents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-border">
            {assignedStudents.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3>No Students Assigned</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                  Students will appear here once assigned by the DLO.
                </p>
              </div>
            ) : (
              assignedStudents.map((s) => {
                const logs = getStudentLogbook(s.studentId);
                const pending = logs.filter((l) => l.approvalStatus === "Pending").length;
                const lastLog = logs.sort((a, b) => b.date.localeCompare(a.date))[0];
                const daysSince = lastLog
                  ? Math.floor((Date.now() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999;
                const isFlagged = daysSince >= 3;

                return (
                  <div key={s.id} className="p-5 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0" style={{ fontSize: "0.85rem" }}>
                        {s.studentName.split(" ").map((w) => w[0]).join("")}
                      </div>
                      {isFlagged && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-card" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p style={{ fontSize: "0.95rem" }}>{s.studentName}</p>
                        <span className={`px-2 py-0.5 rounded ${
                          s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        }`} style={{ fontSize: "0.65rem" }}>
                          {s.status}
                        </span>
                        {s.grade && (
                          <span className="px-2 py-0.5 rounded bg-secondary" style={{ fontSize: "0.7rem" }}>
                            Grade: {s.grade} ({s.gradeStatus})
                          </span>
                        )}
                        {isFlagged && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse" style={{ fontSize: "0.65rem" }}>
                            {daysSince}d inactive
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                        {s.studentId} · {s.department} · {s.companyName}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.7rem" }}>
                          <BookMarked className="w-3 h-3" /> {logs.length} entries
                          {pending > 0 && <span className="px-1 bg-amber-100 text-amber-700 rounded ml-1">{pending} pending</span>}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.7rem" }}>
                          <Calendar className="w-3 h-3" /> Last: {lastLog?.date || "None"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedStudent(s.id); setActiveTab("logbook"); setEvaluation({ ...defaultEvaluation }); }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2 shrink-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <Eye className="w-4 h-4" /> Review
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STUDENT DETAIL VIEW ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setSelectedStudent(null); setActiveTab("logbook"); }}
          className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center gap-1.5"
          style={{ fontSize: "0.8rem" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2>{student?.studentName}</h2>
            <span className={`px-2 py-0.5 rounded ${
              student?.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
            }`} style={{ fontSize: "0.7rem" }}>
              {student?.status}
            </span>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
            {student?.studentId} · {student?.department} · {student?.companyName}
          </p>
        </div>
        {student?.status === "Active" && !student?.grade && (
          <button
            onClick={() => setActiveTab("evaluation")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <ClipboardCheck className="w-4 h-4" /> Submit Evaluation
          </button>
        )}
      </div>

      {/* Student Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Log Entries</p>
          <p style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{logbookEntries.length}</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
            {approvedCount} approved · {pendingCount} pending
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Attendance</p>
          <p style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{attendanceRecords.length}</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
            {verifiedAttendance} verified
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Site Visits</p>
          <p style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{siteVisitNotes.length}</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Recorded</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Grade</p>
          <p style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{student?.grade || "—"}</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
            {student?.gradeStatus || "Not graded"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:rounded-lg sm:gap-2 sm:flex-1 ${
              activeTab === tab.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline" style={{ fontSize: "0.8rem" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: LOGBOOK ── */}
      {activeTab === "logbook" && (
        <div className="space-y-3">
          {logbookEntries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              <BookMarked className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p style={{ fontSize: "0.85rem" }}>No logbook entries found for this student.</p>
            </div>
          ) : (
            logbookEntries
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <div key={entry.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span style={{ fontSize: "0.9rem" }}>{entry.date}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full ${
                      entry.approvalStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                      entry.approvalStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`} style={{ fontSize: "0.7rem" }}>
                      {entry.approvalStatus}
                    </span>
                  </div>

                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Activities</p>
                    <p style={{ fontSize: "0.85rem" }}>{entry.activities}</p>
                  </div>

                  {entry.skills && (
                    <div>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.skills.split(",").map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground" style={{ fontSize: "0.7rem" }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.challenges && entry.challenges !== "None" && (
                    <div>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Challenges</p>
                      <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{entry.challenges}</p>
                    </div>
                  )}

                  {entry.approvedBy && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <p className="text-emerald-700 flex items-center gap-1.5" style={{ fontSize: "0.75rem" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved by {entry.approvedBy}
                        {entry.approvedAt && ` on ${new Date(entry.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      </p>
                      {entry.supervisorComment && (
                        <p className="text-emerald-600 mt-1" style={{ fontSize: "0.75rem" }}>"{entry.supervisorComment}"</p>
                      )}
                    </div>
                  )}

                  <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
                    Submitted: {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
          )}
        </div>
      )}

      {/* ── TAB: ATTENDANCE ── */}
      {activeTab === "attendance" && (
        <div className="space-y-3">
          {attendanceRecords.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3" />
              <p style={{ fontSize: "0.85rem" }}>No attendance records found.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: "0.7rem" }}>DATE</th>
                    <th className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: "0.7rem" }}>CHECK-IN</th>
                    <th className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: "0.7rem" }}>TYPE</th>
                    <th className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: "0.7rem" }}>LOCATION</th>
                    <th className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: "0.7rem" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{r.date}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{r.checkInTime}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded ${
                          r.checkInType === "gps" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`} style={{ fontSize: "0.65rem" }}>
                          {r.checkInType === "gps" ? "GPS" : "Manual"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" style={{ fontSize: "0.8rem" }}>{r.location}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded ${
                          r.verificationStatus === "Verified" ? "bg-emerald-100 text-emerald-700" :
                          r.verificationStatus === "Rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`} style={{ fontSize: "0.65rem" }}>
                          {r.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SITE VISITS ── */}
      {activeTab === "visits" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              Record observations from site visits to the student's company.
            </p>
            <button
              onClick={() => setShowVisitForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
              style={{ fontSize: "0.85rem" }}
            >
              <MapPin className="w-4 h-4" /> Add Visit Note
            </button>
          </div>

          {/* New Visit Form - Modal */}
          {showVisitForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowVisitForm(false)}>
              <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3>New Site Visit Note</h3>
                <button onClick={() => setShowVisitForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Visit Date *</label>
                  <input type="date" value={newVisit.date} onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Student Engagement (1-5)</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setNewVisit({ ...newVisit, studentEngagement: n })}
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                          newVisit.studentEngagement >= n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                        }`}>
                        <Star className={`w-4 h-4 ${newVisit.studentEngagement >= n ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: "0.8rem" }}>Observations *</label>
                  <textarea value={newVisit.observations} onChange={(e) => setNewVisit({ ...newVisit, observations: e.target.value })}
                    placeholder="Describe your observations during the visit..." rows={3}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Company Feedback</label>
                  <textarea value={newVisit.companyFeedback} onChange={(e) => setNewVisit({ ...newVisit, companyFeedback: e.target.value })}
                    placeholder="What did the company say about the student?" rows={2}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Recommendations</label>
                  <textarea value={newVisit.recommendations} onChange={(e) => setNewVisit({ ...newVisit, recommendations: e.target.value })}
                    placeholder="Any recommendations for the student or company?" rows={2}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowVisitForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                  Cancel
                </button>
                <button onClick={handleAddVisitNote} disabled={!newVisit.date || !newVisit.observations}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}>
                  <Save className="w-4 h-4" /> Save Visit Note
                </button>
              </div>
              </div>
            </div>
            </div>
          )}

          {/* Visit Notes List */}
          {siteVisitNotes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>No site visit notes recorded yet.</p>
            </div>
          ) : (
            siteVisitNotes.map((visit) => (
              <div key={visit.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span style={{ fontSize: "0.9rem" }}>{visit.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${
                        n <= visit.studentEngagement ? "text-amber-500 fill-amber-500" : "text-gray-200"
                      }`} />
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Observations</p>
                  <p style={{ fontSize: "0.85rem" }}>{visit.observations}</p>
                </div>
                {visit.companyFeedback && (
                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Company Feedback</p>
                    <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{visit.companyFeedback}</p>
                  </div>
                )}
                {visit.recommendations && (
                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Recommendations</p>
                    <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{visit.recommendations}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: EVALUATION ── */}
      {activeTab === "evaluation" && student && (() => {
        const config = getActiveConfig(student.department);
        const compiled = getCompiledGrade(student.id);

        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800" style={{ fontSize: "0.85rem" }}>
                As the Academic Supervisor, your only graded contribution is the <strong>Site Visitation Score (30%)</strong>.
                The Attachment Report and Final Presentation scores are entered by the DLO. The breakdown below is read-only —
                use the <em>Site Visit</em> tab to submit or update your rubric.
              </p>
              <p className="text-blue-700 mt-2" style={{ fontSize: "0.75rem" }}>
                Department uses Structure {config.structure}.
              </p>
            </div>

            {compiled ? (
              <GradeBreakdownCard compiled={compiled} studentName={student.studentName} />
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                No grade components have been submitted yet.
              </div>
            )}

            <div className="flex justify-end pt-4">
               <button
                  onClick={() => setActiveTab("visits")}
                  className="px-4 py-2 border border-border bg-background text-foreground rounded-lg hover:bg-accent flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Building2 className="w-4 h-4" /> Submit Site Visit Score
               </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}