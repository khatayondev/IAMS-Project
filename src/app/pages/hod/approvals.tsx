import { useState } from "react";
import { useAppContext } from "../../lib/context";
import { updateApplication, addAuditLog, addNotification } from "../../lib/store";
import { approveGrade, requestGradeRevision } from "../../services/grade-service";
import { StatusBadge } from "../../components/status-badge";
import {
  CheckCircle2, X, AlertTriangle, Clock, Eye, FileText,
  GraduationCap, Filter, Download, ChevronDown, ChevronUp,
  MessageSquare, RotateCcw, Save
} from "lucide-react";
import { toast } from "sonner";

type FilterTab = "pending" | "approved" | "all";

export function HODApprovalsPage() {
  const { user, store } = useAppContext();
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [approvalComment, setApprovalComment] = useState("");

  const dept = user?.department || "";

  // Department apps with grades
  const deptApps = store.applications.filter((a) => a.department === dept);
  const pendingApproval = deptApps.filter((a) => a.gradeStatus === "Submitted");
  const approvedApps = deptApps.filter((a) => a.gradeStatus === "Approved");
  const allGraded = deptApps.filter((a) => a.grade);

  const displayed = filter === "pending"
    ? pendingApproval
    : filter === "approved"
      ? approvedApps
      : allGraded;

  const handleApproveGrade = (appId: string) => {
    const result = approveGrade(appId, user?.name || "");
    if (result.success) {
      toast.success(result.message);
      setExpandedId(null);
      setApprovalComment("");
    } else {
      toast.error(result.message);
    }
  };

  const handleRequestRevision = (appId: string) => {
    if (!revisionReason.trim()) {
      toast.error("Please provide a reason for the revision.");
      return;
    }
    const result = requestGradeRevision(appId, user?.name || "", revisionReason);
    if (result.success) {
      toast.success(result.message);
      setShowRevisionModal(null);
      setRevisionReason("");
      setExpandedId(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleBulkApprove = () => {
    let count = 0;
    pendingApproval.forEach((app) => {
      const result = approveGrade(app.id, user?.name || "");
      if (result.success) count++;
    });
    toast.success(`${count} grade${count > 1 ? "s" : ""} approved.`);
  };

  const getGradeColor = (grade: string) => {
    if (["A", "A+", "A-"].includes(grade)) return "bg-emerald-100 text-emerald-700";
    if (["B+", "B", "B-"].includes(grade)) return "bg-blue-100 text-blue-700";
    if (["C+", "C", "C-"].includes(grade)) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Grade Approvals</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Review and approve final grades submitted by academic supervisors
          </p>
        </div>
        <div className="flex gap-2">
          {pendingApproval.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              style={{ fontSize: "0.85rem" }}
            >
              <CheckCircle2 className="w-4 h-4" /> Approve All ({pendingApproval.length})
            </button>
          )}
          <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{pendingApproval.length}</p>
          <p className="text-amber-600 mt-1" style={{ fontSize: "0.8rem" }}>Pending Approval</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-emerald-800" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{approvedApps.length}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: "0.8rem" }}>Approved</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p style={{ fontSize: "2rem", lineHeight: 1.1 }}>{allGraded.length}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8rem" }}>Total Graded</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {([
          { key: "pending" as const, label: `Pending (${pendingApproval.length})` },
          { key: "approved" as const, label: `Approved (${approvedApps.length})` },
          { key: "all" as const, label: `All Graded (${allGraded.length})` },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === tab.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
            }`}
            style={{ fontSize: "0.8rem" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3>Request Grade Revision</h3>
              <button onClick={() => { setShowRevisionModal(null); setRevisionReason(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              The academic supervisor will be notified to review and resubmit the grade.
            </p>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Reason for Revision *</label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Explain why the grade needs revision..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowRevisionModal(null); setRevisionReason(""); }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button
                onClick={() => handleRequestRevision(showRevisionModal)}
                disabled={!revisionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                style={{ fontSize: "0.85rem" }}
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grades List */}
      {displayed.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No grades to display</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            {filter === "pending" ? "No grades are pending your approval." : "No grades found for this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className={`bg-card border rounded-xl transition-colors ${
                app.gradeStatus === "Submitted" ? "border-amber-200" : "border-border"
              }`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full text-left p-5 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0" style={{ fontSize: "0.85rem" }}>
                    {app.studentName.split(" ").map((w) => w[0]).join("")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "0.9rem" }}>{app.studentName}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{app.studentId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{app.companyName}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Supervisor: {app.supervisorAssigned || "N/A"}</span>
                    </div>
                  </div>

                  {/* Grade Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1.5 rounded-lg ${getGradeColor(app.grade || "")}`} style={{ fontSize: "1.1rem" }}>
                      {app.grade}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${
                      app.gradeStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                      app.gradeStatus === "Submitted" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`} style={{ fontSize: "0.65rem" }}>
                      {app.gradeStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  {app.gradeStatus === "Submitted" && (
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApproveGrade(app.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setShowRevisionModal(app.id)}
                        className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Revise
                      </button>
                    </div>
                  )}

                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        ["Student", app.studentName],
                        ["Student ID", app.studentId],
                        ["Department", app.department],
                        ["Level", app.level],
                        ["Company", app.companyName],
                        ["Academic Supervisor", app.supervisorAssigned || "N/A"],
                        ["Applied", app.dateApplied],
                        ["Status", app.status],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{l}</p>
                          <p style={{ fontSize: "0.85rem" }}>{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-secondary/30 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>FINAL GRADE</p>
                        <p className="text-primary" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{app.grade}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>STATUS</p>
                        <StatusBadge status={app.gradeStatus || "Pending"} />
                      </div>
                    </div>

                    {app.gradeStatus === "Approved" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <p className="text-emerald-700" style={{ fontSize: "0.8rem" }}>
                          Grade approved and finalized. Ready for academic records export.
                        </p>
                      </div>
                    )}

                    {app.gradeStatus === "Submitted" && (
                      <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                        <div>
                          <label style={{ fontSize: "0.8rem" }}>Approval Comment (optional)</label>
                          <input
                            type="text"
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveGrade(app.id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve Grade
                          </button>
                          <button
                            onClick={() => setShowRevisionModal(app.id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <RotateCcw className="w-4 h-4" /> Request Revision
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}