import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import {
  getAttendanceRecords,
  verifyCheckIn,
  getMissedCheckIns,
  subscribeAttendance,
  type AttendanceRecord,
} from "../../services/attendance-service";
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Clock, Search, X, Navigation, Globe, FileText, User } from "lucide-react";
import { toast } from "sonner";
import type { ExtendedRole } from "../../services/auth-service";

interface Props {
  viewRole: ExtendedRole;
}

/**
 * Parse GPS location string to extract coordinates and place name.
 */
function parseLocation(location: string): { lat: string; lng: string; placeName: string } | null {
  const match = location.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)\s*\(([^)]+)\)/);
  if (match) {
    return { lat: match[1], lng: match[2], placeName: match[3] };
  }
  return null;
}

export function AttendancePage({ viewRole }: Props) {
  const { user } = useAppContext();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeAttendance(() => setTick((t) => t + 1));
  }, []);

  const department = (viewRole === "dlo" || viewRole === "hod" || viewRole === "academic") ? user?.department : undefined;

  const records = getAttendanceRecords({
    department: viewRole === "clo" ? undefined : department,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filtered = studentFilter
    ? records.filter(
        (r) =>
          r.studentName.toLowerCase().includes(studentFilter.toLowerCase()) ||
          r.studentId.toLowerCase().includes(studentFilter.toLowerCase())
      )
    : records;

  const missedCheckIns = getMissedCheckIns(viewRole === "clo" ? undefined : department);
  const pendingVerification = records.filter((r) => r.verificationStatus === "Pending Verification");

  const handleVerify = (recordId: string, approved: boolean) => {
    const result = verifyCheckIn(recordId, approved, user?.name || "");
    if (result.success) {
      toast.success(result.message);
      setSelectedRecord(null);
    }
  };

  const statusColors: Record<string, string> = {
    Verified: "bg-emerald-100 text-emerald-700",
    "Pending Verification": "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Attendance Records</h1>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          {viewRole === "clo" ? "Institution-wide attendance tracking" : viewRole === "supervisor" ? "Verify student check-ins" : "Department attendance overview"}
          {" · "}Click any row to view full details
        </p>
      </div>

      {/* Alerts */}
      {missedCheckIns.length > 0 && (viewRole === "clo" || viewRole === "dlo" || viewRole === "academic") && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between p-4 border-b border-border bg-amber-50/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-medium text-foreground" style={{ fontSize: "0.9rem" }}>Missed Check-In Alerts</h4>
            </div>
            {missedCheckIns.length > 0 && (
              <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium border border-amber-200" style={{ fontSize: "0.75rem" }}>
                {missedCheckIns.length} Issue{missedCheckIns.length !== 1 && "s"}
              </span>
            )}
          </div>
          <div className="divide-y divide-border bg-card">
            {missedCheckIns.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>All students are caught up!</div>
            ) : (
              missedCheckIns.slice(0, 5).map((m) => (
                <div key={m.studentId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E3F3FF] flex items-center justify-center text-primary shrink-0" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {m.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground leading-tight" style={{ fontSize: "0.9rem" }}>{m.studentName}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>{m.studentId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {m.missedDays >= 7 ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[0.65rem] font-semibold tracking-wide uppercase">Critical</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[0.65rem] font-semibold tracking-wide uppercase">Warning</span>
                    )}
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                      <Clock className="w-3 h-3" />
                      {m.missedDays}d ago
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pending Verification (for Industry Supervisor) */}
      {viewRole === "supervisor" && pendingVerification.length > 0 && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <h3>Pending Manual Check-In Verification</h3>
          {pendingVerification.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <button onClick={() => setSelectedRecord(r)} className="text-left flex-1">
                <p style={{ fontSize: "0.85rem" }}>{r.studentName} — {r.date}</p>
                <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.8rem" }}>
                  <MapPin className="w-3 h-3" /> {r.location}
                </p>
              </button>
              <div className="flex gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleVerify(r.id, true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  style={{ fontSize: "0.8rem" }}
                >
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => handleVerify(r.id, false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  style={{ fontSize: "0.8rem" }}
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: "0.75rem" }}>Search Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              placeholder="Name or ID..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: "0.75rem" }}>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: "0.75rem" }}>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
        </div>
      </div>

      {/* ===== DETAIL POPUP MODAL ===== */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              selectedRecord.checkInType === "gps" ? "bg-blue-50 border-b border-blue-100" : "bg-amber-50 border-b border-amber-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedRecord.checkInType === "gps" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {selectedRecord.checkInType === "gps" ? <Navigation className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <p style={{ fontSize: "0.9rem" }} className="text-foreground">
                    {selectedRecord.checkInType === "gps" ? "GPS Auto-Locate Check-In" : "Manual Check-In Entry"}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Record ID: {selectedRecord.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Student Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground" style={{ fontSize: "0.85rem" }}>
                  {selectedRecord.studentName.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <p style={{ fontSize: "0.95rem" }} className="text-foreground">{selectedRecord.studentName}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{selectedRecord.studentId} · {selectedRecord.department}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: "0.65rem" }}>Date</p>
                  <p style={{ fontSize: "0.9rem" }} className="text-foreground">{selectedRecord.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: "0.65rem" }}>Check-In Time</p>
                  <p style={{ fontSize: "0.9rem" }} className="text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" /> {selectedRecord.checkInTime}
                  </p>
                </div>
              </div>
              {selectedRecord.checkOutTime && (
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: "0.65rem" }}>Check-Out Time</p>
                  <p style={{ fontSize: "0.9rem" }} className="text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" /> {selectedRecord.checkOutTime}
                  </p>
                </div>
              )}

              {/* Check-in Type & Method */}
              <div>
                <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: "0.65rem" }}>Check-In Method</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                    selectedRecord.checkInType === "gps" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}
                  style={{ fontSize: "0.8rem" }}
                >
                  {selectedRecord.checkInType === "gps" ? <Navigation className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {selectedRecord.checkInType === "gps" ? "GPS Auto-Locate" : "Manual Entry"}
                </span>
              </div>

              {/* Location Details */}
              <div>
                <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: "0.65rem" }}>Location Details</p>

                {selectedRecord.checkInType === "gps" ? (
                  (() => {
                    const parsed = parseLocation(selectedRecord.location);
                    return parsed ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-blue-600" style={{ fontSize: "0.7rem" }}>Latitude</p>
                            <p className="text-blue-900" style={{ fontSize: "0.95rem" }}>{parsed.lat}</p>
                          </div>
                          <div>
                            <p className="text-blue-600" style={{ fontSize: "0.7rem" }}>Longitude</p>
                            <p className="text-blue-900" style={{ fontSize: "0.95rem" }}>{parsed.lng}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-blue-600" style={{ fontSize: "0.7rem" }}>Place Name</p>
                          <p className="text-blue-900 flex items-center gap-1.5" style={{ fontSize: "0.9rem" }}>
                            <Globe className="w-4 h-4" /> {parsed.placeName}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <p className="text-blue-600" style={{ fontSize: "0.65rem" }}>
                            GPS coordinates captured automatically via device geolocation API. Accuracy depends on device and network conditions.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <p className="flex items-center gap-1.5" style={{ fontSize: "0.85rem" }}>
                          <MapPin className="w-4 h-4 text-muted-foreground" /> {selectedRecord.location}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-amber-600" style={{ fontSize: "0.7rem" }}>Location / Reason Provided</p>
                      <p className="text-amber-900" style={{ fontSize: "0.9rem" }}>
                        {selectedRecord.location}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-amber-200">
                      <p className="text-amber-600" style={{ fontSize: "0.65rem" }}>
                        Manual check-in entries require verification by the industry supervisor before being accepted. Common reasons: GPS unavailable, working from remote site, or device issues.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div>
                <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: "0.65rem" }}>Verification Status</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusColors[selectedRecord.verificationStatus]}`} style={{ fontSize: "0.8rem" }}>
                    {selectedRecord.verificationStatus === "Verified" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {selectedRecord.verificationStatus === "Pending Verification" && <Clock className="w-3.5 h-3.5" />}
                    {selectedRecord.verificationStatus === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                    {selectedRecord.verificationStatus}
                  </span>
                  {selectedRecord.verifiedBy && (
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      by {selectedRecord.verifiedBy}
                      {selectedRecord.verifiedAt && ` on ${new Date(selectedRecord.verifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-between items-center">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                style={{ fontSize: "0.85rem" }}
              >
                Close
              </button>
              {viewRole === "supervisor" && selectedRecord.verificationStatus === "Pending Verification" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(selectedRecord.id, true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify Check-In
                  </button>
                  <button
                    onClick={() => handleVerify(selectedRecord.id, false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile card list (hidden on desktop) ── */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border" style={{ fontSize: "0.85rem" }}>No attendance records found.</div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3 cursor-pointer active:bg-muted/30 transition-colors"
              onClick={() => setSelectedRecord(r)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ fontSize: "0.9rem" }}>{r.studentName}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{r.studentId}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${statusColors[r.verificationStatus]}`}>{r.verificationStatus}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                <span>📅 {r.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.checkInTime}{r.checkOutTime ? ` → ${r.checkOutTime}` : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground truncate max-w-[70%]" style={{ fontSize: "0.78rem" }}>📍 {r.location}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${r.checkInType === "gps" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.checkInType === "gps" ? <Navigation className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {r.checkInType === "gps" ? "GPS" : "Manual"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table (hidden on mobile) ── */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Student</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Date</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Check-In</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Check-Out</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Type</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Location</th>
                <th className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedRecord(r)}
                  >
                    <td className="px-4 py-3">
                      <p style={{ fontSize: "0.85rem" }}>{r.studentName}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{r.studentId}</p>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{r.date}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1" style={{ fontSize: "0.85rem" }}>
                        <Clock className="w-3 h-3 text-muted-foreground" /> {r.checkInTime}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.checkOutTime ? (
                        <span className="flex items-center gap-1" style={{ fontSize: "0.85rem" }}>
                          <Clock className="w-3 h-3 text-muted-foreground" /> {r.checkOutTime}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic" style={{ fontSize: "0.75rem" }}>Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${r.checkInType === "gps" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {r.checkInType === "gps" ? <Navigation className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                        {r.checkInType === "gps" ? "GPS" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-muted-foreground" style={{ fontSize: "0.8rem" }} title={r.location}>
                        {r.location}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded ${statusColors[r.verificationStatus]}`} style={{ fontSize: "0.7rem" }}>
                        {r.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
