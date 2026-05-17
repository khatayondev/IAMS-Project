import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import {
  getIssues, createIssue, addIssueNote, updateIssueStatus, escalateIssue,
  subscribeIssues, type Issue, type IssueType, type IssueStatus,
} from "../../services/issue-service";
import {
  AlertTriangle, Plus, MessageSquare, ArrowUpRight, CheckCircle2, Clock, X,
  Search, Filter, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import type { ExtendedRole } from "../../services/auth-service";

interface Props {
  viewRole: ExtendedRole;
}

export function IssuesPage({ viewRole }: Props) {
  const { user } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [createForm, setCreateForm] = useState({ type: "academic" as IssueType, title: "", description: "", priority: "Medium" });
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeIssues(() => setTick((t) => t + 1));
  }, []);

  const department = (viewRole === "dlo" || viewRole === "hod" || viewRole === "academic") ? user?.department : undefined;
  const allIssues = getIssues({ department: viewRole === "clo" ? undefined : department });
  const issues = viewRole === "student"
    ? allIssues.filter((i) => i.raisedBy === user?.name)
    : allIssues;

  const filtered = issues.filter((i) => {
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    const matchType = typeFilter === "All" || i.type === typeFilter;
    const matchPriority = priorityFilter === "All" || i.priority === priorityFilter;
    const matchSearch = search === "" ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.raisedBy.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchPriority && matchSearch;
  });

  const roleLabel = viewRole === "clo" ? "CLO" : viewRole === "dlo" ? "DLO" : viewRole === "student" ? "Student" : viewRole === "academic" ? "Academic Supervisor" : viewRole === "supervisor" ? "Industry Supervisor" : "HOD";

  // Stats
  const openCount = issues.filter((i) => i.status === "Open").length;
  const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
  const escalatedCount = issues.filter((i) => i.status === "Escalated").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;

  const handleCreate = () => {
    if (!createForm.title.trim() || !createForm.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    const result = createIssue(
      createForm.type,
      createForm.title,
      createForm.description,
      user?.name || "",
      roleLabel,
      user?.department || "Unknown",
      user?.studentId
    );
    if (result.success) {
      toast.success(result.message);
      setShowCreate(false);
      setCreateForm({ type: "academic", title: "", description: "", priority: "Medium" });
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedIssue) return;
    addIssueNote(selectedIssue.id, user?.name || "", roleLabel, noteText);
    toast.success("Note added.");
    setNoteText("");
    const updated = getIssues().find((i) => i.id === selectedIssue.id);
    if (updated) setSelectedIssue(updated);
  };

  const handleResolve = (issueId: string) => {
    updateIssueStatus(issueId, "Resolved", "Resolved by " + (user?.name || ""));
    toast.success("Issue resolved.");
    setSelectedIssue(null);
  };

  const handleEscalate = (issueId: string) => {
    escalateIssue(issueId, user?.name || "");
    toast.success("Issue escalated to CLO.");
    setSelectedIssue(null);
  };

  const handleMarkInProgress = (issueId: string) => {
    updateIssueStatus(issueId, "In Progress", "Being reviewed by " + (user?.name || ""));
    toast.success("Issue marked as in progress.");
    const updated = getIssues().find((i) => i.id === issueId);
    if (updated) setSelectedIssue(updated);
  };

  const statusColors: Record<IssueStatus, string> = {
    Open: "bg-blue-100 text-blue-700",
    "In Progress": "bg-amber-100 text-amber-700",
    Escalated: "bg-red-100 text-red-700",
    Resolved: "bg-emerald-100 text-emerald-700",
  };

  const priorityColors: Record<string, string> = {
    Low: "text-gray-500 bg-gray-50",
    Medium: "text-amber-600 bg-amber-50",
    High: "text-red-600 bg-red-50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Issues & Escalations</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {viewRole === "student" ? "Report and track issues" : "Manage and resolve reported issues"} · {issues.length} total
          </p>
        </div>
        {(viewRole === "student" || viewRole === "dlo" || viewRole === "clo") && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            style={{ fontSize: "0.85rem" }}
          >
            <Plus className="w-4 h-4" /> Report Issue
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open", value: openCount, color: "text-blue-600 bg-blue-50", icon: AlertTriangle },
          { label: "In Progress", value: inProgressCount, color: "text-amber-600 bg-amber-50", icon: Clock },
          { label: "Escalated", value: escalatedCount, color: "text-red-600 bg-red-50", icon: ArrowUpRight },
          { label: "Resolved", value: resolvedCount, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.label ? "All" : s.label)}
            className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-all ${statusFilter === s.label ? "border-primary ring-1 ring-primary" : "border-border hover:shadow-md"}`}
          >
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{s.label}</p>
              <p style={{ fontSize: "1.25rem" }}>{s.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card"
          style={{ fontSize: "0.85rem" }}
        >
          <option value="All">All Types</option>
          <option value="academic">Academic</option>
          <option value="company">Company</option>
          <option value="logbook">Logbook</option>
          <option value="supervisor">Supervisor</option>
          <option value="other">Other</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card"
          style={{ fontSize: "0.85rem" }}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <div className="flex gap-1.5">
          {["All", "Open", "In Progress", "Escalated", "Resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
              style={{ fontSize: "0.8rem" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedIssue(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full ${statusColors[selectedIssue.status]}`} style={{ fontSize: "0.75rem" }}>{selectedIssue.status}</span>
                    <span className={`px-2.5 py-0.5 rounded-full ${priorityColors[selectedIssue.priority]}`} style={{ fontSize: "0.75rem" }}>{selectedIssue.priority} Priority</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize" style={{ fontSize: "0.75rem" }}>{selectedIssue.type}</span>
                  </div>
                  <h2>{selectedIssue.title}</h2>
                </div>
                <button onClick={() => setSelectedIssue(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
              </div>

              <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{selectedIssue.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Raised By</p>
                  <p style={{ fontSize: "0.8rem" }}>{selectedIssue.raisedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Role</p>
                  <p style={{ fontSize: "0.8rem" }}>{selectedIssue.raisedByRole}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Department</p>
                  <p style={{ fontSize: "0.8rem" }}>{selectedIssue.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Assigned To</p>
                  <p style={{ fontSize: "0.8rem" }}>{selectedIssue.assignedTo}</p>
                </div>
              </div>

              {/* Activity Log */}
              <div className="border-t border-border pt-4 space-y-3">
                <h4>Activity Log ({selectedIssue.notes.length})</h4>
                {selectedIssue.notes.length === 0 && (
                  <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>No notes yet.</p>
                )}
                {selectedIssue.notes.map((note) => (
                  <div key={note.id} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ fontSize: "0.5rem" }}>
                        {note.author.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <span style={{ fontSize: "0.8rem" }}>{note.author}</span>
                      <span className="text-muted-foreground px-1.5 py-0.5 bg-secondary rounded" style={{ fontSize: "0.6rem" }}>{note.authorRole}</span>
                      <span className="text-muted-foreground ml-auto" style={{ fontSize: "0.65rem" }}>
                        {new Date(note.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem" }}>{note.content}</p>
                  </div>
                ))}

                {selectedIssue.status !== "Resolved" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                      style={{ fontSize: "0.85rem" }}
                    />
                    <button onClick={handleAddNote} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>Add</button>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedIssue.status !== "Resolved" && (viewRole === "clo" || viewRole === "dlo") && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  {selectedIssue.status === "Open" && (
                    <button
                      onClick={() => handleMarkInProgress(selectedIssue.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:opacity-90"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <Clock className="w-4 h-4" /> Mark In Progress
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(selectedIssue.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:opacity-90"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </button>
                  {viewRole === "dlo" && selectedIssue.status !== "Escalated" && (
                    <button
                      onClick={() => handleEscalate(selectedIssue.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <ArrowUpRight className="w-4 h-4" /> Escalate to CLO
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Report an Issue</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "0.8rem" }}>Issue Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as IssueType })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="academic">Academic</option>
                  <option value="company">Company-Related</option>
                  <option value="logbook">Logbook</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Title</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Brief summary of the issue"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem" }}>Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Provide details about the issue..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>Submit Issue</button>
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No issues found</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            {statusFilter !== "All" ? `No ${statusFilter.toLowerCase()} issues.` : "No issues have been reported."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((issue) => (
            <button
              key={issue.id}
              onClick={() => { setSelectedIssue(issue); setNoteText(""); }}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full ${statusColors[issue.status]}`} style={{ fontSize: "0.7rem" }}>{issue.status}</span>
                  <span className={`px-2 py-0.5 rounded-full ${priorityColors[issue.priority]}`} style={{ fontSize: "0.7rem" }}>{issue.priority}</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize" style={{ fontSize: "0.65rem" }}>{issue.type}</span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                  {new Date(issue.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p style={{ fontSize: "0.9rem" }} className="text-foreground">{issue.title}</p>
              <p style={{ fontSize: "0.8rem" }} className="text-muted-foreground mt-0.5 truncate">{issue.description}</p>
              <div className="flex gap-3 mt-2 text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                <span>By: {issue.raisedBy}</span>
                <span>{issue.department}</span>
                {issue.notes.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{issue.notes.length}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}