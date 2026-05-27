import { useEffect, useState } from "react";
import { Shield, Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, User, Eye } from "lucide-react";
import { exportToCSV } from "../../lib/csv-export";
import { toast } from "sonner";
import { apiClient } from "../../lib/api-client";

const actionColors: Record<string, string> = {
  "Created Term": "bg-blue-100 text-blue-700",
  "Approved Company": "bg-emerald-100 text-emerald-700",
  "Approved Application": "bg-green-100 text-green-700",
  "Assigned Supervisor": "bg-violet-100 text-violet-700",
  "Updated Template": "bg-amber-100 text-amber-700",
  "Rejected Company": "bg-red-100 text-red-700",
  "Rejected Application": "bg-red-100 text-red-700",
  "Archived Term": "bg-gray-200 text-gray-600",
  "Grade Submitted": "bg-indigo-100 text-indigo-700",
  "Grade Approved": "bg-teal-100 text-teal-700",
};

const PAGE_SIZE = 10;

type AuditLogItem = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
};

function normalizeAuditLogs(logs: any[]): AuditLogItem[] {
  return logs.map((log, index) => ({
    id: String(log.id ?? log.audit_id ?? `audit-${index}`),
    timestamp: log.timestamp ?? log.created_at ?? log.createdAt ?? new Date().toISOString(),
    user: log.user?.name ?? log.user_name ?? log.actor ?? log.performed_by ?? "System",
    action: log.action ?? log.event ?? log.verb ?? "Updated",
    target: log.target ?? log.auditable_type ?? log.resource ?? "Record",
    details: log.details ?? log.description ?? log.message ?? "No additional details provided.",
  }));
}

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      const response = await apiClient.getAuditLogs();
      if (!active) return;

      if (response.success && response.data.length > 0) {
        setLogs(normalizeAuditLogs(response.data));
      } else {
        setLogs([]);
      }
      setLoading(false);
    }

    loadLogs().catch(() => {
      if (!active) return;
      setLogs([]);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueUsers = [...new Set(logs.map((l) => l.user))];

  const filtered = logs.filter((log) => {
    const matchSearch =
      search === "" ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All" || log.action === actionFilter;
    const matchUser = userFilter === "All" || log.user === userFilter;
    const logDate = new Date(log.timestamp);
    const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchAction && matchUser && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getActionColor = (action: string) => actionColors[action] || "bg-secondary text-secondary-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Audit Logs</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {loading ? "Loading audit logs from the API..." : `All system actions are logged for accountability · ${filtered.length} records`}
          </p>
        </div>
        <button
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
          onClick={() => {
            exportToCSV(
              filtered.map(l => ({ Timestamp: l.timestamp, User: l.user, Action: l.action, Target: l.target, Details: l.details })),
              "audit_logs"
            );
            toast.success("Audit logs exported!");
          }}
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-border rounded-lg bg-background"
            style={{ fontSize: "0.85rem" }}
          >
            <option value="All">All Actions</option>
            {uniqueActions.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-border rounded-lg bg-background"
            style={{ fontSize: "0.85rem" }}
          >
            <option value="All">All Users</option>
            {uniqueUsers.map((u) => <option key={u}>{u}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-border rounded-lg bg-background"
              style={{ fontSize: "0.85rem" }}
            />
            <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-border rounded-lg bg-background"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
        </div>
        {(search || actionFilter !== "All" || userFilter !== "All" || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(""); setActionFilter("All"); setUserFilter("All"); setDateFrom(""); setDateTo(""); setPage(0); }}
            className="mt-3 text-primary hover:underline flex items-center gap-1"
            style={{ fontSize: "0.8rem" }}
          >
            <Filter className="w-3.5 h-3.5" /> Clear all filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Timestamp</th>
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>User</th>
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Action</th>
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Target</th>
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}>Details</th>
                <th className="text-left px-4 py-3" style={{ fontSize: "0.75rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((log) => (
                <tr key={log.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${selectedLog === log.id ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" style={{ fontSize: "0.8rem" }}>
                    <div>
                      <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                      <p style={{ fontSize: "0.7rem" }}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${getActionColor(log.action)}`} style={{ fontSize: "0.75rem" }}>
                      <Shield className="w-3 h-3" />{log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{log.target}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" style={{ fontSize: "0.8rem" }}>
                    {log.details}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                    No audit logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedLog && (() => {
          const log = logs.find((l) => l.id === selectedLog);
          if (!log) return null;
          return (
            <div className="border-t border-border bg-muted/20 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Log ID</p>
                  <p style={{ fontSize: "0.85rem" }}>{log.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Full Timestamp</p>
                  <p style={{ fontSize: "0.85rem" }}>{new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Performed By</p>
                  <p style={{ fontSize: "0.85rem" }}>{log.user}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>IP Address</p>
                  <p style={{ fontSize: "0.85rem" }}>192.168.1.{Math.floor(Math.random() * 255)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Full Details</p>
                <p style={{ fontSize: "0.85rem" }}>{log.details}</p>
              </div>
            </div>
          );
        })()}

        {/* Pagination */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-md ${page === i ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                style={{ fontSize: "0.8rem" }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}