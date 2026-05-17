import { useState } from "react";
import { StatusBadge } from "../../components/status-badge";
import { useAppContext } from "../../lib/context";
import { supervisors } from "../../lib/mock-data";
import {
  approveApplication,
  rejectApplication,
  assignSupervisor,
  bulkApproveApplications,
} from "../../services/application-service";
import { Search, CheckCircle2, XCircle, UserPlus, Download } from "lucide-react";
import { toast } from "sonner";
import type { ExtendedRole } from "../../services/auth-service";
import { exportToCSV } from "../../lib/csv-export";

interface Props {
  viewRole: ExtendedRole;
}

export function ApplicationsPage({ viewRole }: Props) {
  const { user, store } = useAppContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState<string | null>(null);

  const department = viewRole === "dlo" ? user?.department : undefined;

  const filtered = store.applications.filter((a) => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchDept = !department || a.department === department;
    return matchSearch && matchStatus && matchDept;
  });

  const statuses = ["All", "Pending", "Approved", "Active", "Company Accepted", "Completed", "Rejected"];

  const handleApprove = (id: string) => {
    const result = approveApplication(id, user?.name || "System");
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleReject = (id: string) => {
    const result = rejectApplication(id, user?.name || "System", "Application does not meet requirements");
    if (result.success) {
      toast.error(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleBulkApprove = () => {
    const pendingIds = filtered.filter((a) => a.status === "Pending").map((a) => a.id);
    if (pendingIds.length === 0) {
      toast.info("No pending applications to approve.");
      return;
    }
    const result = bulkApproveApplications(pendingIds, user?.name || "System");
    toast.success(result.message);
  };

  const handleAssignSupervisor = (appId: string, supName: string) => {
    const result = assignSupervisor(appId, supName, user?.name || "System");
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setShowAssign(null);
  };

  const detail = selectedApp ? store.applications.find((a) => a.id === selectedApp) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Applications</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {viewRole === "clo" ? "All departments" : `${department} Department`}
          </p>
        </div>
        <button
          onClick={handleBulkApprove}
          className="px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <CheckCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">Bulk Approve</span>
        </button>
        <button
          onClick={() => exportToCSV(
            filtered.map(a => ({ Student: a.studentName, ID: a.studentId, Company: a.companyName, Department: a.department, Status: a.status, "Company Status": a.companyStatus, Date: a.dateApplied, Supervisor: a.supervisorAssigned || "" })),
            "applications_export"
          )}
          className="px-3 md:px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent"
              }`}
              style={{ fontSize: "0.8rem" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Student</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>ID</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Company</th>
                  {viewRole === "clo" && <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Dept</th>}
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Co. Status</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Status</th>
                  <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer ${selectedApp === app.id ? "bg-secondary/50" : ""}`}
                    onClick={() => setSelectedApp(app.id)}
                  >
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.8rem" }}>{app.studentId}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.companyName}</td>
                    {viewRole === "clo" && <td className="px-4 py-3" style={{ fontSize: "0.8rem" }}>{app.department.split(" ")[0]}</td>}
                    <td className="px-4 py-3"><StatusBadge status={app.companyStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {app.status === "Pending" && (
                          <>
                            <button onClick={() => handleApprove(app.id)} className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(app.id)} className="p-1.5 rounded-md hover:bg-red-100 text-red-600">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {app.status === "Company Accepted" && (
                          <div className="relative">
                            <button
                              onClick={() => setShowAssign(showAssign === app.id ? null : app.id)}
                              className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            {showAssign === app.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowAssign(null)} />
                                <div className="absolute right-0 top-8 w-56 bg-card border border-border rounded-lg shadow-xl z-50 p-2">
                                  <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground px-2 py-1">
                                    Assign Supervisor
                                  </p>
                                  {supervisors
                                    .filter((s) => s.department === app.department)
                                    .map((sup) => (
                                      <button
                                        key={sup.id}
                                        onClick={() => handleAssignSupervisor(app.id, sup.name)}
                                        className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex justify-between"
                                        style={{ fontSize: "0.8rem" }}
                                      >
                                        <span>{sup.name}</span>
                                        <span className="text-muted-foreground">
                                          {sup.currentLoad}/{sup.maxLoad}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={viewRole === "clo" ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {detail && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3>Application Details</h3>
                  <button onClick={() => setSelectedApp(null)} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    ["Student", detail.studentName],
                    ["Student ID", detail.studentId],
                    ["Department", detail.department],
                    ["Level", detail.level],
                    ["Company", detail.companyName],
                    ["Date Applied", detail.dateApplied],
                    ["Supervisor", detail.supervisorAssigned || "Not assigned"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p style={{ fontSize: "0.85rem" }}>{val}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Status</p>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Company Approval</p>
                    <StatusBadge status={detail.companyStatus} />
                  </div>
                </div>
                <div className="pt-3 border-t border-border space-y-2">
                  {detail.status === "Pending" && (
                    <>
                      <button onClick={() => handleApprove(detail.id)} className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
                        Approve Application
                      </button>
                      <button onClick={() => handleReject(detail.id)} className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
                        Reject Application
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}