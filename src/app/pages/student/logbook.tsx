import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../lib/context";
import { apiClient } from "../../lib/api-client";
import { useToastAction } from "../../lib/hooks";
import { Plus, BookMarked, Calendar, CheckCircle2, Clock, AlertTriangle, X, AlertCircle } from "lucide-react";
import { CheckInModal } from "../../components/check-in-modal";

export function LogbookPage() {
  const { user } = useAppContext();

  const [internshipId, setInternshipId] = useState<number | null>(null);
  const [internshipStatus, setInternshipStatus] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    activities_description: "",
    skills_learned: "",
    challenges_faced: "",
  });

  const { execute: submitLogEntry, loading: isSubmitting } = useToastAction();

  const loadData = useCallback(async () => {
    // Get active internship from dashboard
    const dashRes = await apiClient.getDashboard("student");
    const activeInternship = dashRes.data?.active_internship;
    if (!activeInternship?.id) return;

    const id = Number(activeInternship.id);
    const status = activeInternship.status;
    const company = activeInternship.company?.name;

    setInternshipId(id);
    setInternshipStatus(status);
    setCompanyName(company);

    // Fetch logbook entries
    const logsRes = await apiClient.getLogbookEntries({ internship_id: id, per_page: 50 });
    if (logsRes.success) setEntries(logsRes.data);

    // Check today's attendance (only for active internships)
    if (status === "active" || status === "approved") {
      const today = new Date().toISOString().split("T")[0];
      const attRes = await apiClient.getInternshipAttendance(String(id), { from_date: today, to_date: today });
      if (attRes.success) {
        const records = Array.isArray(attRes.data) ? attRes.data : attRes.data?.attendance ?? [];
        setCheckedInToday(records.some((r: any) => ["present", "late", "half_day"].includes(r.status)));
      }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isLogbookActive = internshipStatus === "active" || internshipStatus === "approved";

  const handleNewEntry = () => {
    if (!isLogbookActive) return; // Silent return, message shown in UI
    if (!internshipId) return;
    if (!checkedInToday) { setCheckInModalOpen(true); return; }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!isLogbookActive) return;
    if (!internshipId) return;
    if (!checkedInToday) { setCheckInModalOpen(true); return; }

    await submitLogEntry(async () => {
      const res = await apiClient.submitLogbook({
        internship_id: internshipId,
        entry_date: form.entry_date,
        activities_description: form.activities_description,
        skills_learned: form.skills_learned || undefined,
        challenges_faced: form.challenges_faced || undefined,
      });
      if (res.success) {
        setForm({ entry_date: new Date().toISOString().split("T")[0], activities_description: "", skills_learned: "", challenges_faced: "" });
        setShowForm(false);
        loadData();
      }
      return res;
    }, {
      successMessage: "Logbook entry submitted successfully!",
      errorMessage: "Failed to submit logbook entry.",
    });
  };

  const onCheckInSuccess = () => {
    setCheckedInToday(true);
    setCheckInModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Daily Logbook</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {companyName ? `${companyName}` : "Record activities"}
        </p>
      </div>

      {/* Internship Not Active Warning */}
      {internshipId && !isLogbookActive && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-sm">
              {internshipStatus === "completed" ? "Completed" : "Not Active"}
            </p>
            <p className="text-red-700 text-xs mt-0.5">
              {internshipStatus === "completed" ? "Internship completed. View history for past entries." : "Cannot create entries. Status: " + internshipStatus}
            </p>
          </div>
        </div>
      )}

      {/* Check-in Warning */}
      {!checkedInToday && internshipId && isLogbookActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-800 font-semibold text-sm">Check-in Required</p>
            <p className="text-amber-700 text-xs mt-0.5">Check in before creating entries.</p>
            <button
              type="button"
              onClick={() => setCheckInModalOpen(true)}
              className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-semibold"
            >
              Check In
            </button>
          </div>
        </div>
      )}

      {!internshipId && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <BookMarked className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No active internship</p>
        </div>
      )}

      {/* New Entry Modal - Bottom sheet on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium">Submitting...</p>
                </div>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3>New Logbook Entry</h3>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Date</label>
                <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card" style={{ fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Activities Performed *</label>
                <textarea value={form.activities_description} onChange={(e) => setForm({ ...form, activities_description: e.target.value })}
                  placeholder="Describe what you did today..."
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card min-h-[120px]" style={{ fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Skills Learned</label>
                <input type="text" value={form.skills_learned} onChange={(e) => setForm({ ...form, skills_learned: e.target.value })}
                  placeholder="e.g., Python scripting, Network config, Customer service"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card" style={{ fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Challenges</label>
                <textarea value={form.challenges_faced} onChange={(e) => setForm({ ...form, challenges_faced: e.target.value })}
                  placeholder="Any difficulties or blockers..."
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-card min-h-[80px]" style={{ fontSize: "0.85rem" }} />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowForm(false)} disabled={isSubmitting}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent font-medium" style={{ fontSize: "0.85rem" }}>
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting || !form.activities_description.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50" style={{ fontSize: "0.85rem" }}>
                  Submit Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {internshipId && entries.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <BookMarked className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No entries yet. Start recording!</p>
        </div>
      ) : (
        <div className="space-y-2 pb-24">
          {entries.map((entry: any) => (
            <div key={entry.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{entry.entry_date}</p>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  entry.status === "approved"  ? "bg-emerald-100 text-emerald-700" :
                  entry.status === "rejected"  ? "bg-red-100 text-red-700" :
                  entry.status === "submitted" ? "bg-blue-100 text-blue-700" :
                                                 "bg-amber-100 text-amber-700"
                }`}>
                  {entry.status}
                </span>
              </div>

              <div>
                <p className="text-muted-foreground text-xs font-semibold mb-1">Activities</p>
                <p className="text-sm line-clamp-2">{entry.activities_description}</p>
              </div>

              {entry.skills_learned && (
                <div className="flex flex-wrap gap-1">
                  {String(entry.skills_learned).split(",").map((s: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground border border-border text-xs">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}

              {entry.challenges_faced && (
                <div>
                  <p className="text-muted-foreground text-xs font-semibold mb-1">Challenges</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{entry.challenges_faced}</p>
                </div>
              )}

              {(entry.industry_supervisor_comment || entry.academic_supervisor_comment) && (
                <div className={`rounded-lg p-2 border text-xs ${
                  entry.status === "rejected" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {entry.industry_supervisor_comment ?? entry.academic_supervisor_comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB Button */}
      {internshipId && isLogbookActive && (
        <button
          onClick={handleNewEntry}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 flex items-center justify-center transition-opacity"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        onSuccess={onCheckInSuccess}
        internshipId={internshipId ?? undefined}
        internshipStatus={internshipStatus ?? undefined}
      />
    </div>
  );
}
