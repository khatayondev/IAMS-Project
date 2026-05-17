import { useState } from "react";
import { useAppContext } from "../../lib/context";
import {
  MapPin, Calendar, Clock, Plus, CheckCircle2, AlertCircle,
  Building2, User, Phone, Mail, X, Save, Star, FileText,
  ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { sendNotification, sendAnnouncement } from "../../services/notification-service";
import { submitSiteVisitation } from "../../services/grading-service";
import { VISITATION_CRITERIA, VisitationCriterionKey, VisitationCriterionRating } from "../../types/grading";

interface SiteVisit {
  id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  companyAddress: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  notes?: string;
  observations?: string;
  ratings?: Record<VisitationCriterionKey, VisitationCriterionRating>;
  companyFeedback?: string;
  recommendations?: string;
  contactPerson?: string;
  contactPhone?: string;
}

const initialVisits: SiteVisit[] = [
  {
    id: "v1",
    studentId: "CS/2023/001",
    studentName: "John Doe",
    companyName: "Ghana Telecom Ltd",
    companyAddress: "Independence Ave, Accra",
    date: "2026-04-22",
    time: "10:00",
    status: "Scheduled",
    contactPerson: "Mr. Mensah",
    contactPhone: "+233201234567",
    notes: "First visit — introduce yourself and assess student workspace.",
  },
  {
    id: "v2",
    studentId: "BA/2023/012",
    studentName: "Kofi Asare",
    companyName: "Ghana Telecom Ltd",
    companyAddress: "Independence Ave, Accra",
    date: "2026-04-22",
    time: "14:00",
    status: "Scheduled",
    contactPerson: "Mr. Mensah",
    contactPhone: "+233201234567",
  },
  {
    id: "v3",
    studentId: "CS/2023/001",
    studentName: "John Doe",
    companyName: "Ghana Telecom Ltd",
    companyAddress: "Independence Ave, Accra",
    date: "2026-04-10",
    time: "09:30",
    status: "Completed",
    contactPerson: "Mr. Mensah",
    contactPhone: "+233201234567",
    observations: "Student is well-integrated. Workstation is properly equipped. Company mentor actively engaged with student.",
    studentEngagement: 4,
    companyFeedback: "Very satisfied with student's performance. Proactive and punctual.",
    recommendations: "Continue current trajectory. Student should start preparing final report outline.",
  },
  {
    id: "v4",
    studentId: "EE/2023/031",
    studentName: "Nana Adjei",
    companyName: "Volta River Authority",
    companyAddress: "28th Feb Road, Accra",
    date: "2026-04-05",
    time: "11:00",
    status: "Completed",
    contactPerson: "Eng. Boateng",
    contactPhone: "+233209876543",
    observations: "Student was not present at workstation during visit. Supervisor said student left early.",
    studentEngagement: 2,
    companyFeedback: "Student attendance has been inconsistent. Needs improvement.",
    recommendations: "Follow up with student about attendance policy. Consider issuing a warning.",
  },
];

type FilterStatus = "All" | "Scheduled" | "Completed" | "Cancelled";

export function AcademicVisitsPage() {
  const { user, store } = useAppContext();
  const [visits, setVisits] = useState<SiteVisit[]>(initialVisits);
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState<{
    observations: string;
    ratings: Record<VisitationCriterionKey, VisitationCriterionRating>;
  }>({
    observations: "",
    ratings: VISITATION_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: 0 }), {} as Record<VisitationCriterionKey, VisitationCriterionRating>),
  });
  const [rescheduleVisitId, setRescheduleVisitId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "", reason: "" });

  const notifyParties = (
    kind: "scheduled" | "rescheduled" | "cancelled",
    visit: SiteVisit,
    extra?: string
  ) => {
    const academicName = user?.name || "Academic Supervisor";
    const when = `${visit.date} at ${visit.time}`;
    const titleByKind = {
      scheduled: "Upcoming Site Visit",
      rescheduled: "Site Visit Rescheduled",
      cancelled: "Site Visit Cancelled",
    } as const;
    const studentMsg = {
      scheduled: `${academicName} has scheduled a site visit to ${visit.companyName} on ${when}. Please be present at your workstation.`,
      rescheduled: `${academicName} rescheduled your site visit to ${when}.${extra ? ` Reason: ${extra}` : ""}`,
      cancelled: `${academicName} cancelled the site visit previously set for ${when}.${extra ? ` Reason: ${extra}` : ""}`,
    }[kind];
    const supervisorMsg = {
      scheduled: `${academicName} will visit ${visit.companyName} on ${when} to meet with ${visit.studentName}. Contact: ${visit.contactPerson || "—"}.`,
      rescheduled: `The site visit for ${visit.studentName} at ${visit.companyName} has been rescheduled to ${when}.${extra ? ` Reason: ${extra}` : ""}`,
      cancelled: `The site visit for ${visit.studentName} at ${visit.companyName} on ${when} has been cancelled.${extra ? ` Reason: ${extra}` : ""}`,
    }[kind];

    // In-app notifications
    sendNotification("system", titleByKind[kind], studentMsg);
    sendNotification("system", titleByKind[kind], supervisorMsg);

    // Mocked email via the announcement log
    sendAnnouncement(
      titleByKind[kind],
      `${studentMsg}\n\n${supervisorMsg}`,
      academicName,
      [`Student: ${visit.studentName}`, `Industry Supervisor: ${visit.contactPerson || visit.companyName}`]
    );
  };

  // Students for scheduling
  const assignedStudents = store.applications.filter(
    (a) => (a.status === "Active") &&
      (a.supervisorAssigned === user?.name || a.department === user?.department)
  );

  const [newVisit, setNewVisit] = useState({
    studentId: "",
    date: "",
    time: "",
    notes: "",
  });

  const filtered = filter === "All" ? visits : visits.filter((v) => v.status === filter);
  const upcoming = visits.filter((v) => v.status === "Scheduled" && v.date >= new Date().toISOString().split("T")[0]);
  const completed = visits.filter((v) => v.status === "Completed");

  const handleScheduleVisit = () => {
    const student = assignedStudents.find((s) => s.studentId === newVisit.studentId);
    if (!student) return;
    const company = store.companies.find((c) => c.id === student.companyId);

    const visit: SiteVisit = {
      id: `v-${Date.now()}`,
      studentId: student.studentId,
      studentName: student.studentName,
      companyName: student.companyName,
      companyAddress: company?.address || "",
      date: newVisit.date,
      time: newVisit.time,
      status: "Scheduled",
      contactPerson: company?.contactPerson,
      contactPhone: company?.contactPhone,
      notes: newVisit.notes,
    };

    setVisits((prev) => [visit, ...prev]);
    setShowNewForm(false);
    setNewVisit({ studentId: "", date: "", time: "", notes: "" });

    notifyParties("scheduled", visit);
    toast.success(`Site visit scheduled. ${student.studentName} and the industry supervisor have been notified.`);
  };

  const handleCompleteVisit = (visitId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return;
    
    // Call the grading service
    const actor = {
      id: user?.id || "u-academic",
      name: user?.name || "Academic Supervisor",
      role: "academic" as const,
      department: user?.department,
    };
    
    // Use the actual application ID. We have to look it up from store using studentId
    const app = store.applications.find(a => a.studentId === visit.studentId);
    if (app) {
      submitSiteVisitation(app.id, completeForm.ratings, completeForm.observations, actor);
    }
    
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: "Completed" as const,
              observations: completeForm.observations,
              ratings: completeForm.ratings,
            }
          : v
      )
    );
    setShowCompleteForm(null);
    setCompleteForm({ 
      observations: "", 
      ratings: VISITATION_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: 0 }), {} as Record<VisitationCriterionKey, VisitationCriterionRating>) 
    });
    toast.success("Visit marked as completed and scores submitted.");
  };

  const handleCancelVisit = (visitId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    setVisits((prev) => prev.map((v) => v.id === visitId ? { ...v, status: "Cancelled" as const } : v));
    if (visit) notifyParties("cancelled", visit);
    toast.success("Visit cancelled. Student and industry supervisor notified.");
  };

  const handleRescheduleVisit = () => {
    if (!rescheduleVisitId) return;
    const visit = visits.find((v) => v.id === rescheduleVisitId);
    if (!visit) return;
    const updated: SiteVisit = {
      ...visit,
      date: rescheduleForm.date,
      time: rescheduleForm.time,
      status: "Rescheduled",
    };
    setVisits((prev) => prev.map((v) => v.id === rescheduleVisitId ? updated : v));
    notifyParties("rescheduled", updated, rescheduleForm.reason);
    setRescheduleVisitId(null);
    setRescheduleForm({ date: "", time: "", reason: "" });
    toast.success("Visit rescheduled. Student and industry supervisor notified.");
  };

  const statusColors: Record<string, string> = {
    Scheduled: "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-gray-100 text-gray-500",
    Rescheduled: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Site Visits</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Schedule, track, and record observations from company site visits
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Plus className="w-4 h-4" /> Schedule New Visit
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-800" style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{upcoming.length}</p>
          <p className="text-blue-600 mt-1" style={{ fontSize: "0.8rem" }}>Upcoming</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-emerald-800" style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{completed.length}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: "0.8rem" }}>Completed</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{visits.length}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8rem" }}>Total</p>
        </div>
      </div>

      {/* New Visit Form - Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3>Schedule New Site Visit</h3>
                <button onClick={() => setShowNewForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Student *</label>
                  <select
                    value={newVisit.studentId}
                    onChange={(e) => setNewVisit({ ...newVisit, studentId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="">Select student...</option>
                    {assignedStudents.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.studentName} — {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Visit Date *</label>
                  <input type="date" value={newVisit.date} onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>Time *</label>
                  <input type="time" value={newVisit.time} onChange={(e) => setNewVisit({ ...newVisit, time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: "0.8rem" }}>Notes (optional)</label>
                  <textarea value={newVisit.notes} onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                    placeholder="Any preparation notes or agenda items..." rows={2}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                  Cancel
                </button>
                <button
                  onClick={handleScheduleVisit}
                  disabled={!newVisit.studentId || !newVisit.date || !newVisit.time}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Calendar className="w-4 h-4" /> Schedule Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5">
        {(["All", "Scheduled", "Completed", "Cancelled"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
            }`}
            style={{ fontSize: "0.8rem" }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reschedule Visit Modal */}
      {rescheduleVisitId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRescheduleVisitId(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3>Reschedule Site Visit</h3>
                <button onClick={() => setRescheduleVisitId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: "0.8rem" }}>New Date *</label>
                  <input type="date" value={rescheduleForm.date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem" }}>New Time *</label>
                  <input type="time" value={rescheduleForm.time} onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: "0.8rem" }}>Reason (optional)</label>
                  <textarea value={rescheduleForm.reason} onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                    placeholder="Why is the visit being rescheduled?" rows={2}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setRescheduleVisitId(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleVisit}
                  disabled={!rescheduleForm.date || !rescheduleForm.time}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Calendar className="w-4 h-4" /> Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Visit Modal */}
      {showCompleteForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3>Record Visit Observations & Score</h3>
                <p className="text-muted-foreground text-xs mt-1">Submit the 10-criterion rubric to lock the visitation score.</p>
              </div>
              <button onClick={() => setShowCompleteForm(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold block" style={{ fontSize: "0.85rem" }}>Evaluation Rubric (0-3 points per criterion)</label>
                <div className="bg-[#0B5ED7]/10 text-[#0B5ED7] px-3 py-1 rounded-md font-semibold text-sm">
                  Total: {Object.values(completeForm.ratings).reduce((a, b) => a + (b as number), 0)} / 30
                </div>
              </div>
              <div className="space-y-3">
                  {VISITATION_CRITERIA.map((criterion) => (
                    <div key={criterion.key} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-muted/20 border border-border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-[#0B5ED7] text-xs mr-2">{criterion.key}</span>
                        <span style={{ fontSize: "0.85rem" }}>{criterion.label}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {[0, 1, 2, 3].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCompleteForm(prev => ({ ...prev, ratings: { ...prev.ratings, [criterion.key]: val } }))}
                            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                              completeForm.ratings[criterion.key] === val
                                ? "bg-[#0B5ED7] text-white border-[#0B5ED7]"
                                : "bg-card border-border hover:bg-accent text-muted-foreground"
                            }`}
                            style={{ fontSize: "0.85rem" }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              <div>
                <label style={{ fontSize: "0.8rem" }} className="font-semibold mb-1 block">General Observations & Comments *</label>
                <textarea 
                  value={completeForm.observations} 
                  onChange={(e) => setCompleteForm({ ...completeForm, observations: e.target.value })}
                  placeholder="What did you observe during the visit?" 
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background" 
                  style={{ fontSize: "0.85rem" }} 
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowCompleteForm(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button
                onClick={() => handleCompleteVisit(showCompleteForm)}
                disabled={!completeForm.observations.trim()}
                className="px-4 py-2 bg-[#0B5ED7] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
                style={{ fontSize: "0.85rem" }}
              >
                <CheckCircle2 className="w-4 h-4" /> Lock & Submit Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visits List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No visits found</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            {filter !== "All" ? `No ${filter.toLowerCase()} visits.` : "Schedule your first site visit."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((visit) => {
              const isExpanded = expandedVisit === visit.id;
              return (
                <div key={visit.id} className={`bg-card border rounded-xl transition-colors ${
                  visit.status === "Scheduled" ? "border-blue-200" : "border-border"
                }`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedVisit(isExpanded ? null : visit.id);
                      }
                    }}
                    className="w-full text-left p-5 flex items-center gap-4 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      visit.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                      visit.status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {visit.status === "Completed" ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontSize: "0.9rem" }}>{visit.studentName}</span>
                        <span className={`px-2 py-0.5 rounded ${statusColors[visit.status]}`} style={{ fontSize: "0.65rem" }}>
                          {visit.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                        {visit.companyName} · {visit.companyAddress}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                          <Calendar className="w-3 h-3" /> {visit.date}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                          <Clock className="w-3 h-3" /> {visit.time}
                        </span>
                        {visit.ratings && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0B5ED7]/10 text-[#0B5ED7] rounded" style={{ fontSize: "0.7rem", fontWeight: 500 }}>
                            Score: {Object.values(visit.ratings).reduce((a, b) => a + b, 0)}/30
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {visit.status === "Scheduled" && (
                      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setShowCompleteForm(visit.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleVisitId(visit.id);
                            setRescheduleForm({ date: visit.date, time: visit.time, reason: "" });
                          }}
                          className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelVisit(visit.id)}
                          className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="shrink-0 ml-1 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border space-y-3 pt-4">
                      {visit.contactPerson && (
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "0.8rem" }}>
                            <User className="w-3.5 h-3.5" /> {visit.contactPerson}
                          </span>
                          {visit.contactPhone && (
                            <span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "0.8rem" }}>
                              <Phone className="w-3.5 h-3.5" /> {visit.contactPhone}
                            </span>
                          )}
                        </div>
                      )}

                      {visit.notes && (
                        <div>
                          <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                          <p style={{ fontSize: "0.85rem" }}>{visit.notes}</p>
                        </div>
                      )}

                      {visit.observations && (
                        <div>
                          <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider mb-1">Observations</p>
                          <p style={{ fontSize: "0.85rem" }}>{visit.observations}</p>
                        </div>
                      )}

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
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}