import { useState } from "react";
import { useAppContext } from "../../lib/context";
import {
  getStudentLogbook,
  approveLogbookEntry,
  requestLogbookRevision,
} from "../../services/logbook-service";
import type { LogbookEntry } from "../../lib/store";
import {
  BookMarked, CheckCircle2, RotateCcw, Calendar, User, Search,
  ChevronDown, ChevronUp, X, MessageSquare, Clock, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export function SupervisorLogbooksPage() {
  const { user, store } = useAppContext();
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterStudent, setFilterStudent] = useState<string>("All");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(null);

  // Get students assigned to this supervisor's company
  const assignedStudents = store.applications.filter(
    (a) => a.status === "Active" && a.companyName === "Ghana Telecom Ltd"
  );

  // Get all logbook entries for assigned students
  const allEntries = assignedStudents.flatMap((a) => {
    const logs = getStudentLogbook(a.studentId);
    return logs.map((log) => ({
      ...log,
      studentName: a.studentName,
      department: a.department,
    }));
  });

  // Apply filters
  let filtered = [...allEntries];
  if (filterStatus !== "All") {
    filtered = filtered.filter((e) => e.approvalStatus === filterStatus);
  }
  if (filterStudent !== "All") {
    filtered = filtered.filter((e) => e.studentId === filterStudent);
  }

  // Sort: pending first, then by date descending
  filtered.sort((a, b) => {
    if (a.approvalStatus === "Pending" && b.approvalStatus !== "Pending") return -1;
    if (a.approvalStatus !== "Pending" && b.approvalStatus === "Pending") return 1;
    return b.date.localeCompare(a.date);
  });

  const pendingCount = allEntries.filter((e) => e.approvalStatus === "Pending").length;
  const approvedCount = allEntries.filter((e) => e.approvalStatus === "Approved").length;
  const revisionCount = allEntries.filter((e) => e.approvalStatus === "Revision Requested").length;

  const handleApprove = (entryId: string) => {
    const result = approveLogbookEntry(entryId, user?.name || "", approvalComment || undefined);
    if (result.success) {
      toast.success(result.message);
      setApprovalComment("");
      setExpandedEntry(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleRequestRevision = (entryId: string) => {
    const result = requestLogbookRevision(entryId, user?.name || "", revisionComment);
    if (result.success) {
      toast.success(result.message);
      setRevisionComment("");
      setShowRevisionModal(null);
      setExpandedEntry(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleBulkApprove = () => {
    const pendingEntries = filtered.filter((e) => e.approvalStatus === "Pending");
    let approved = 0;
    pendingEntries.forEach((entry) => {
      const result = approveLogbookEntry(entry.id, user?.name || "");
      if (result.success) approved++;
    });
    toast.success(`${approved} logbook entr${approved === 1 ? "y" : "ies"} approved.`);
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    "Revision Requested": "bg-red-100 text-red-700",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    Pending: <Clock className="w-3.5 h-3.5" />,
    Approved: <CheckCircle2 className="w-3.5 h-3.5" />,
    "Revision Requested": <AlertTriangle className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Student Logbook Review</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Review and approve daily logbook entries before they are forwarded to DLO and Academic Supervisor
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            style={{ fontSize: "0.85rem" }}
          >
            <CheckCircle2 className="w-4 h-4" /> Approve All Pending ({pendingCount})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{pendingCount}</p>
          <p className="text-amber-600 mt-1" style={{ fontSize: "0.8rem" }}>Pending Review</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-emerald-800" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{approvedCount}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: "0.8rem" }}>Approved</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-800" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{revisionCount}</p>
          <p className="text-red-600 mt-1" style={{ fontSize: "0.8rem" }}>Revision Requested</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: "0.75rem" }}>Status</label>
          <div className="flex gap-1.5">
            {["All", "Pending", "Approved", "Revision Requested"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                }`}
                style={{ fontSize: "0.8rem" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: "0.75rem" }}>Student</label>
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background"
            style={{ fontSize: "0.85rem" }}
          >
            <option value="All">All Students</option>
            {assignedStudents.map((a) => (
              <option key={a.studentId} value={a.studentId}>{a.studentName} ({a.studentId})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3>Request Revision</h3>
              <button onClick={() => { setShowRevisionModal(null); setRevisionComment(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              The student will be notified to revise and resubmit this entry.
            </p>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Reason for Revision *</label>
              <textarea
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="Explain what needs to be changed or added..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRevisionModal(null); setRevisionComment(""); }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestRevision(showRevisionModal)}
                disabled={!revisionComment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                style={{ fontSize: "0.85rem" }}
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No logbook entries found</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            {filterStatus !== "All" ? `No ${filterStatus.toLowerCase()} entries.` : "Students haven't submitted any logbook entries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isExpanded = expandedEntry === entry.id;
            return (
              <div
                key={entry.id}
                className={`bg-card border rounded-xl transition-colors ${
                  entry.approvalStatus === "Pending" ? "border-amber-200" : "border-border"
                }`}
              >
                {/* Entry Header — clickable to expand */}
                <div
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  className="w-full text-left p-5 flex items-center gap-4 cursor-pointer"
                >
                  {/* Student Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0" style={{ fontSize: "0.8rem" }}>
                    {entry.studentName.split(" ").map((w: string) => w[0]).join("")}
                  </div>

                  {/* Entry Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "0.9rem" }} className="text-foreground">{entry.studentName}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{entry.studentId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                        <Calendar className="w-3 h-3" /> {entry.date}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${statusColors[entry.approvalStatus]}`} style={{ fontSize: "0.65rem" }}>
                        {statusIcons[entry.approvalStatus]} {entry.approvalStatus}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate mt-1" style={{ fontSize: "0.8rem" }}>
                      {entry.activities}
                    </p>
                  </div>

                  {/* Quick Action for Pending */}
                  {entry.approvalStatus === "Pending" && (
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApprove(entry.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setShowRevisionModal(entry.id)}
                        className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Revise
                      </button>
                    </div>
                  )}

                  <div className="shrink-0 ml-2 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-border mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Activities Performed</p>
                        <p style={{ fontSize: "0.85rem" }} className="text-foreground">{entry.activities}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Skills Learned</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.skills ? entry.skills.split(",").map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground" style={{ fontSize: "0.7rem" }}>
                              {s.trim()}
                            </span>
                          )) : <span className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>None recorded</span>}
                        </div>
                      </div>
                    </div>

                    {entry.challenges && (
                      <div>
                        <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Challenges</p>
                        <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{entry.challenges}</p>
                      </div>
                    )}

                    {/* Approval info */}
                    {entry.approvalStatus === "Approved" && entry.approvedBy && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700" style={{ fontSize: "0.8rem" }}>
                            Approved by {entry.approvedBy} on {entry.approvedAt ? new Date(entry.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        {entry.supervisorComment && (
                          <p className="text-emerald-600 mt-1" style={{ fontSize: "0.8rem" }}>
                            Comment: {entry.supervisorComment}
                          </p>
                        )}
                      </div>
                    )}

                    {entry.approvalStatus === "Revision Requested" && entry.supervisorComment && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700" style={{ fontSize: "0.8rem" }}>Revision requested</span>
                        </div>
                        <p className="text-red-600 mt-1" style={{ fontSize: "0.8rem" }}>
                          Reason: {entry.supervisorComment}
                        </p>
                      </div>
                    )}

                    {/* Approval with optional comment (for Pending) */}
                    {entry.approvalStatus === "Pending" && (
                      <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                        <div>
                          <label style={{ fontSize: "0.8rem" }}>Comment (optional)</label>
                          <input
                            type="text"
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                            placeholder="Add a note for the student..."
                            className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(entry.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve Entry
                          </button>
                          <button
                            onClick={() => setShowRevisionModal(entry.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <RotateCcw className="w-4 h-4" /> Request Revision
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                      Submitted: {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
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