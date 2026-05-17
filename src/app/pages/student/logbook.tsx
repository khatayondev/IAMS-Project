import { useState, useEffect, useSyncExternalStore } from "react";
import { useAppContext } from "../../lib/context";
import { submitLogbookEntry, getStudentLogbook } from "../../services/logbook-service";
import { Plus, BookMarked, Calendar, MapPin, CheckCircle2, Clock, AlertTriangle, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { hasCheckedInToday, subscribeAttendance } from "../../services/attendance-service";
import { CheckInModal } from "../../components/check-in-modal";

export function LogbookPage() {
  const { user, store } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    activities: "",
    skills: "",
    challenges: "",
    checkInType: "gps" as "gps" | "manual",
    locationDetails: ""
  });

  // Track check-in status
  const [checkedInToday, setCheckedInToday] = useState(false);
  useEffect(() => {
    if (user?.studentId) {
      const updateCheckInStatus = () => {
        setCheckedInToday(hasCheckedInToday(user.studentId || ""));
      };
      updateCheckInStatus();
      return subscribeAttendance(updateCheckInStatus);
    }
  }, [user]);

  const handleNewEntry = () => {
    if (!checkedInToday) {
      toast.error("You must check in for the day before creating a logbook entry.");
      setCheckInModalOpen(true);
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!checkedInToday) {
      toast.error("You must check in for the day before creating a logbook entry.");
      setCheckInModalOpen(true);
      return;
    }

    const result = submitLogbookEntry(
      user?.studentId || "",
      form.date,
      form.activities,
      form.skills,
      form.challenges
    );
    if (result.success) {
      toast.success(result.message);
      setForm({
        date: new Date().toISOString().split("T")[0],
        activities: "",
        skills: "",
        challenges: "",
        checkInType: "gps",
        locationDetails: ""
      });
      setShowForm(false);
    } else {
      toast.error(result.message);
    }
  };

  // Force re-read from store
  const entries = getStudentLogbook(user?.studentId || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Daily Logbook</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Record your daily internship activities
          </p>
        </div>
        <button
          onClick={handleNewEntry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Check-in Warning */}
      {!checkedInToday && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-amber-800 dark:text-amber-300" style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              Check-in Required
            </h4>
            <p className="text-amber-700 dark:text-amber-400 mt-1" style={{ fontSize: "0.8rem" }}>
              You must check in for the day before creating logbook entries. Click the "Check In" button in the top navbar.
            </p>
            <button
              onClick={() => setCheckInModalOpen(true)}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
            >
              Check In Now
            </button>
          </div>
        </div>
      )}

      {/* New Entry Form - Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>New Logbook Entry</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-accent">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>Activities Performed *</label>
            <textarea
              value={form.activities}
              onChange={(e) => setForm({ ...form, activities: e.target.value })}
              placeholder="Describe what you did today..."
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card min-h-[120px]"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>Skills Learned</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="e.g., Python scripting, Network config, Customer service"
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>Challenges</label>
            <textarea
              value={form.challenges}
              onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              placeholder="Any difficulties or blockers..."
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card min-h-[80px]"
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
              Submit Entry
            </button>
          </div>
          </div>
        </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No logbook entries yet</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            Start recording your daily internship activities.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <p style={{ fontSize: "0.85rem" }}>{entry.date}</p>
                </div>
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                    entry.approvalStatus === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : entry.approvalStatus === "Revision Requested"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                  style={{ fontSize: "0.7rem" }}
                >
                  {entry.approvalStatus === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                  {entry.approvalStatus === "Pending" && <Clock className="w-3 h-3" />}
                  {entry.approvalStatus === "Revision Requested" && <AlertTriangle className="w-3 h-3" />}
                  {entry.approvalStatus}
                </span>
              </div>
              <div>
                <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">
                  Activities
                </p>
                <p style={{ fontSize: "0.85rem" }}>{entry.activities}</p>
              </div>
              {entry.skills && (
                <div>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.skills.split(",").map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground" style={{ fontSize: "0.7rem" }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.challenges && (
                <div>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">
                    Challenges
                  </p>
                  <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{entry.challenges}</p>
                </div>
              )}
              {entry.supervisorComment && (
                <div className={`rounded-lg p-3 ${
                  entry.approvalStatus === "Revision Requested" ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"
                }`}>
                  <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">
                    Supervisor Feedback
                  </p>
                  <p style={{ fontSize: "0.8rem" }} className={entry.approvalStatus === "Revision Requested" ? "text-red-700" : "text-emerald-700"}>
                    {entry.supervisorComment}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}