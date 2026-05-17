import { useState, useMemo } from "react";
import { useAppContext } from "../../lib/context";
import { addApplication, addNotification } from "../../lib/store";
import {
  searchCompanies, findCompanyByName, getBranchesForCompany,
  findBranchByName, createCompanyWithBranch, createBranch,
} from "../../services/company-service";
import { ghanaRegions } from "../../lib/mock-data";
import { StatusBadge } from "../../components/status-badge";
import {
  FileText, Building2, MapPin, Phone, Mail, User, ChevronRight,
  ChevronLeft, CheckCircle2, AlertCircle, Search, Plus, Info,
  Calendar, Clock, Shield, Upload, Eye, ArrowRight,
  AlertTriangle, Sparkles, History, GitBranch
} from "lucide-react";
import { toast } from "sonner";

type View = "windows" | "apply" | "tracker";
type Step = 1 | 2 | 3 | 4;

// Mock status history for existing application
function getStatusHistory(app: {
  dateApplied: string;
  status: string;
  companyStatus: string;
  supervisorAssigned?: string;
}) {
  const history: { status: string; timestamp: string; description: string; actor: string }[] = [];
  history.push({
    status: "Submitted",
    timestamp: `${app.dateApplied}T09:00:00`,
    description: "Application submitted by student",
    actor: "Student",
  });
  if (app.companyStatus === "Approved") {
    history.push({
      status: "Company Verified",
      timestamp: `${app.dateApplied}T14:30:00`,
      description: "Company verified and approved in the system",
      actor: "DLO",
    });
  }
  if (["Approved", "Company Accepted", "Active", "Completed"].includes(app.status)) {
    history.push({
      status: "Approved",
      timestamp: `${app.dateApplied}T16:00:00`,
      description: "Application approved by DLO. Placement letter generated.",
      actor: "Mrs. Esi Mensah (DLO)",
    });
  }
  if (["Company Accepted", "Active", "Completed"].includes(app.status)) {
    history.push({
      status: "Company Accepted",
      timestamp: "2026-03-08T10:15:00",
      description: "Company signed acceptance form. Student confirmed placement.",
      actor: "Company / Student",
    });
  }
  if (app.supervisorAssigned) {
    history.push({
      status: "Supervisor Assigned",
      timestamp: "2026-03-09T11:20:00",
      description: `Academic supervisor ${app.supervisorAssigned} assigned by DLO.`,
      actor: "Mrs. Esi Mensah (DLO)",
    });
  }
  if (app.status === "Active" || app.status === "Completed") {
    history.push({
      status: "Active",
      timestamp: "2026-06-01T08:00:00",
      description: "Internship officially started.",
      actor: "System",
    });
  }
  if (app.status === "Completed") {
    history.push({
      status: "Completed",
      timestamp: "2026-07-31T17:00:00",
      description: "Internship completed. Final evaluation submitted.",
      actor: "System",
    });
  }
  return history;
}

// Company decision: pick an existing company, or register a brand-new one.
type CompanyChoice = "none" | "existing" | "new";
// Branch decision when company is existing: pick an existing branch or add a new one.
type BranchChoice = "none" | "existing" | "new";

interface FormData {
  termId: string;
  // Company selection
  companyChoice: CompanyChoice;
  selectedCompanyId: string; // existing company
  newCompanyName: string;
  newCompanyContactPerson: string;
  newCompanyContactEmail: string;
  // Branch selection
  branchChoice: BranchChoice;
  selectedBranchId: string;
  newBranchName: string;
  newBranchRegion: string;
  newBranchLocation: string;
  newBranchAddress: string;
  newBranchTelephone: string;
  // Personal
  phoneNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  preferredStartDate: string;
  additionalNotes: string;
  uploadCV: boolean;
  uploadMotivation: boolean;
  agreeToTerms: boolean;
}

const defaultForm: FormData = {
  termId: "",
  companyChoice: "none",
  selectedCompanyId: "",
  newCompanyName: "",
  newCompanyContactPerson: "",
  newCompanyContactEmail: "",
  branchChoice: "none",
  selectedBranchId: "",
  newBranchName: "",
  newBranchRegion: ghanaRegions[6] ?? "Greater Accra",
  newBranchLocation: "",
  newBranchAddress: "",
  newBranchTelephone: "",
  phoneNumber: "",
  emergencyContact: "",
  emergencyPhone: "",
  preferredStartDate: "",
  additionalNotes: "",
  uploadCV: false,
  uploadMotivation: false,
  agreeToTerms: false,
};

export function StudentApplicationsPage() {
  const { user, store } = useAppContext();
  // Pick the most recent application for this student so a Completed app from last
  // term doesn't block applying to a new open term.
  const myApp = useMemo(() => {
    const mine = store.applications.filter((a) => a.studentId === user?.studentId);
    if (mine.length === 0) return undefined;
    return [...mine].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0];
  }, [store.applications, user?.studentId]);
  const [view, setView] = useState<View>(myApp ? "tracker" : "windows");
  const [step, setStep] = useState<Step>(1);
  const [companySearch, setCompanySearch] = useState("");
  const [form, setForm] = useState<FormData>({ ...defaultForm });
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // ── STU-01: Open internship windows ──
  const availableTerms = store.terms.filter(
    (t) => t.status === "Active" || t.status === "Upcoming"
  );

  const selectedTerm = store.terms.find((t) => t.id === form.termId);
  const selectedCompany = store.companies.find((c) => c.id === form.selectedCompanyId);
  const selectedBranch = store.branches.find((b) => b.id === form.selectedBranchId);

  // Live search results (re-evaluated when store or query changes)
  const matches = useMemo(
    () => searchCompanies(companySearch, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companySearch, store.companies]
  );
  const exactDup = useMemo(
    () => (companySearch.trim() ? findCompanyByName(companySearch) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companySearch, store.companies]
  );
  const branchesForSelected = useMemo(
    () => (form.selectedCompanyId ? getBranchesForCompany(form.selectedCompanyId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.selectedCompanyId, store.branches]
  );

  // Live duplicate check on new-company name typed in the form (different from search input)
  const newCompanyDup = useMemo(
    () => (form.newCompanyName.trim() ? findCompanyByName(form.newCompanyName) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.newCompanyName, store.companies]
  );
  // Duplicate branch within selected company
  const newBranchDup = useMemo(
    () =>
      form.selectedCompanyId && form.newBranchName.trim()
        ? findBranchByName(form.selectedCompanyId, form.newBranchName)
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.selectedCompanyId, form.newBranchName, store.branches]
  );

  const updateForm = (updates: Partial<FormData>) => setForm((prev) => ({ ...prev, ...updates }));

  // ── STU-02: Eligibility check ──
  const checkEligibility = (termId: string): boolean => {
    const term = store.terms.find((t) => t.id === termId);
    if (!term) return false;

    // Check level eligibility
    const studentLevel = user?.studentId?.startsWith("CS") || user?.studentId?.startsWith("EE") ||
      user?.studentId?.startsWith("ME") || user?.studentId?.startsWith("CE") ||
      user?.studentId?.startsWith("BA") || user?.studentId?.startsWith("AF")
      ? "L300" : "L200";

    if (!term.eligibleLevels.includes(studentLevel)) {
      setEligibilityError(`You are currently at ${studentLevel} but this term requires ${term.eligibleLevels.join(", ")}. You are not eligible for this internship window.`);
      return false;
    }

    // Check department eligibility
    if (user?.department && !term.departments.includes(user.department)) {
      setEligibilityError(`Your department (${user.department}) is not eligible for this term. Eligible departments: ${term.departments.join(", ")}.`);
      return false;
    }

    // Check application window
    const today = new Date().toISOString().split("T")[0];
    if (today < term.applicationStart) {
      setEligibilityError(`The application window has not opened yet. It opens on ${term.applicationStart}.`);
      return false;
    }
    if (today > term.applicationEnd) {
      setEligibilityError(`The application window has closed. It ended on ${term.applicationEnd}.`);
      return false;
    }

    // Check for existing active application
    if (myApp && !["Completed", "Rejected"].includes(myApp.status)) {
      setEligibilityError("You already have an active application. You cannot submit another one until your current application is resolved.");
      return false;
    }

    setEligibilityError(null);
    return true;
  };

  const handleSelectTerm = (termId: string) => {
    updateForm({ termId });
    if (checkEligibility(termId)) {
      setEligibilityError(null);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!form.termId && !eligibilityError;
      case 2: {
        if (form.companyChoice === "existing") {
          if (!form.selectedCompanyId) return false;
          if (form.branchChoice === "existing") return !!form.selectedBranchId;
          if (form.branchChoice === "new") {
            return !!(
              form.newBranchName && form.newBranchRegion && form.newBranchLocation &&
              form.newBranchAddress && form.newBranchTelephone && !newBranchDup
            );
          }
          return false;
        }
        if (form.companyChoice === "new") {
          return !!(
            form.newCompanyName && form.newCompanyContactPerson && form.newCompanyContactEmail &&
            !newCompanyDup &&
            form.newBranchName && form.newBranchRegion && form.newBranchLocation &&
            form.newBranchAddress && form.newBranchTelephone
          );
        }
        return false;
      }
      case 3:
        return !!(form.phoneNumber && form.emergencyContact && form.emergencyPhone);
      case 4:
        return form.agreeToTerms;
      default:
        return false;
    }
  };

  // ── STU-06: Submit application ──
  const handleSubmit = () => {
    let companyId = "";
    let companyName = "";
    let branchId = "";
    let branchName = "";
    let companyStatus: "Approved" | "Pending" = "Approved";
    const actor = user?.name || "Student";

    if (form.companyChoice === "existing") {
      const company = store.companies.find((c) => c.id === form.selectedCompanyId);
      if (!company) { toast.error("Selected company not found."); return; }
      companyId = company.id;
      companyName = company.name;
      companyStatus = company.status === "Approved" ? "Approved" : "Pending";

      if (form.branchChoice === "existing") {
        const br = store.branches.find((b) => b.id === form.selectedBranchId);
        if (!br) { toast.error("Selected branch not found."); return; }
        branchId = br.id;
        branchName = br.name;
      } else {
        const res = createBranch({
          companyId: company.id,
          name: form.newBranchName,
          region: form.newBranchRegion,
          location: form.newBranchLocation,
          address: form.newBranchAddress,
          telephone: form.newBranchTelephone,
          addedBy: actor,
          autoApprove: false,
        });
        if (!res.success || !res.data) { toast.error(res.message); return; }
        branchId = res.data.id;
        branchName = res.data.name;
      }
    } else if (form.companyChoice === "new") {
      const res = createCompanyWithBranch(
        {
          name: form.newCompanyName,
          contactPerson: form.newCompanyContactPerson,
          contactEmail: form.newCompanyContactEmail,
          addedBy: actor,
          autoApprove: false,
        },
        {
          name: form.newBranchName,
          region: form.newBranchRegion,
          location: form.newBranchLocation,
          address: form.newBranchAddress,
          telephone: form.newBranchTelephone,
          addedBy: actor,
          autoApprove: false,
        }
      );
      if (!res.success || !res.data) { toast.error(res.message); return; }
      companyId = res.data.company.id;
      companyName = res.data.company.name;
      branchId = res.data.branch.id;
      branchName = res.data.branch.name;
      companyStatus = "Pending";
    } else {
      toast.error("Please select or register a company.");
      return;
    }

    const newApp = {
      id: `a-${Date.now()}`,
      studentName: user?.name || "",
      studentId: user?.studentId || "",
      department: user?.department || "",
      level: "L300",
      companyId,
      companyName,
      branchId,
      branchName,
      companyStatus,
      status: "Pending" as const,
      dateApplied: new Date().toISOString().split("T")[0],
    };

    addApplication(newApp);
    addNotification({
      id: `n-${Date.now()}`,
      type: "application",
      title: "New Application Submitted",
      message: `${user?.name} (${user?.studentId}) has submitted an attachment application for ${companyName} — ${branchName}.`,
      read: false,
      timestamp: new Date().toISOString(),
    });

    toast.success("Application submitted successfully! Status: Pending Departmental Review");
    setView("tracker");
    setStep(1);
    setForm({ ...defaultForm });
    setCompanySearch("");
  };

  const statusHistory = myApp ? getStatusHistory(myApp) : [];

  const steps = [
    { num: 1, label: "Internship Window" },
    { num: 2, label: "Company" },
    { num: 3, label: "Details & Documents" },
    { num: 4, label: "Review & Submit" },
  ];

  // ────────────────── RENDER ──────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1>Applications</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            View open internship windows, apply, and track your application
          </p>
        </div>
        {/* Tab Switcher */}
        <div className="flex gap-3 justify-center shrink-0">
          {[
            { key: "windows" as const, label: "Open Windows", icon: Calendar },
            { key: "apply" as const, label: "Apply", icon: FileText },
            { key: "tracker" as const, label: "My Application", icon: Eye },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); if (tab.key === "apply") setStep(1); }}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:rounded-lg sm:gap-2 ${
                view === tab.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline" style={{ fontSize: "0.8rem" }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ VIEW: OPEN WINDOWS (STU-01) ═══════ */}
      {view === "windows" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-blue-800" style={{ fontSize: "0.85rem" }}>
                Below are the internship terms currently open or upcoming. Click on a term to view eligibility and apply.
              </p>
            </div>
          </div>

          {availableTerms.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3>No Open Windows</h3>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                There are no active or upcoming internship windows at this time. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTerms.map((term) => {
                const today = new Date().toISOString().split("T")[0];
                const isOpen = today >= term.applicationStart && today <= term.applicationEnd;
                const daysLeft = isOpen
                  ? Math.max(0, Math.ceil((new Date(term.applicationEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;

                return (
                  <div
                    key={term.id}
                    className="bg-card rounded-2xl overflow-hidden hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3>{term.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg ${
                                term.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                              }`}
                              style={{ fontSize: "0.7rem" }}
                            >
                              {term.status}
                            </span>
                            {isOpen && daysLeft !== null && daysLeft <= 5 && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 animate-pulse" style={{ fontSize: "0.7rem" }}>
                                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-block mt-1.5 px-2 py-0.5 rounded ${
                              term.type === "Semestrial" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                            }`}
                            style={{ fontSize: "0.7rem" }}
                          >
                            {term.type} Internship
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            handleSelectTerm(term.id);
                            setView("apply");
                          }}
                          disabled={!isOpen}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${
                            isOpen
                              ? "bg-primary text-primary-foreground hover:opacity-90"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                          style={{ fontSize: "0.8rem" }}
                        >
                          {isOpen ? (
                            <>Apply Now <ArrowRight className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Not Open Yet</>
                          )}
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Application Window</p>
                            <p style={{ fontSize: "0.8rem" }}>{term.applicationStart}</p>
                            <p style={{ fontSize: "0.8rem" }}>to {term.applicationEnd}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Internship Period</p>
                            <p style={{ fontSize: "0.8rem" }}>{term.internshipStart}</p>
                            <p style={{ fontSize: "0.8rem" }}>to {term.internshipEnd}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Eligible Levels</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {term.eligibleLevels.map((l) => (
                                <span key={l} className="px-2 py-0.5 bg-secondary rounded" style={{ fontSize: "0.75rem" }}>
                                  {l}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Eligible Departments</p>
                            <p style={{ fontSize: "0.8rem" }}>
                              {term.departments.length === 6 ? "All Departments" : term.departments.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Archived / Past Terms */}
          {store.terms.filter((t) => t.status === "Completed" || t.status === "Archived").length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-3 text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Past Internship Windows
              </h3>
              <div className="space-y-2">
                {store.terms
                  .filter((t) => t.status === "Completed" || t.status === "Archived")
                  .map((term) => (
                    <div key={term.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p style={{ fontSize: "0.85rem" }} className="text-muted-foreground">{term.name}</p>
                        <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground">
                          {term.internshipStart} → {term.internshipEnd}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded" style={{ fontSize: "0.7rem" }}>
                        {term.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ VIEW: APPLY (STU-02 through STU-06) ═══════ */}
      {view === "apply" && (
        <div className="space-y-5 max-w-4xl">
          {/* Already applied? */}
          {myApp && !["Completed", "Rejected"].includes(myApp.status) ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h3>Application Already Submitted</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                You already have an active application for <strong>{myApp.companyName}</strong>.
                Current status: <strong>{myApp.status}</strong>
              </p>
              <button
                onClick={() => setView("tracker")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                View Application Status
              </button>
            </div>
          ) : (
            <>
              {/* Step Indicator */}
              <div className="flex items-center gap-1 sm:gap-2">
                {steps.map((s, i) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          step > s.num
                            ? "bg-emerald-500 text-white"
                            : step === s.num
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                      </div>
                      <span
                        className={`hidden md:block ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-6 lg:w-12 h-0.5 mx-1.5 ${step > s.num ? "bg-emerald-500" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="bg-card border border-border rounded-xl p-6">
                {/* ── STEP 1: Select Internship Window (STU-01 + STU-02) ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h3>Select Internship Window</h3>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                        Choose the term you want to apply for. The system will check your eligibility automatically.
                      </p>
                    </div>

                    {availableTerms.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <p className="text-amber-800" style={{ fontSize: "0.85rem" }}>
                          No terms are currently accepting applications. Please check back later.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableTerms.map((term) => {
                          const today = new Date().toISOString().split("T")[0];
                          const isOpen = today >= term.applicationStart && today <= term.applicationEnd;

                          return (
                            <button
                              key={term.id}
                              onClick={() => handleSelectTerm(term.id)}
                              disabled={!isOpen}
                              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                                form.termId === term.id
                                  ? eligibilityError ? "border-red-400 bg-red-50/50" : "border-primary bg-primary/5"
                                  : !isOpen
                                    ? "border-border bg-muted/30 cursor-not-allowed opacity-60"
                                    : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p style={{ fontSize: "0.95rem" }} className="text-foreground">{term.name}</p>
                                    <span className={`px-2 py-0.5 rounded ${isOpen ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`} style={{ fontSize: "0.65rem" }}>
                                      {isOpen ? "Open" : "Not Yet Open"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                                      Type: <strong>{term.type}</strong>
                                    </span>
                                    <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                                      Levels: {term.eligibleLevels.join(", ")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                                      Apply: {term.applicationStart} → {term.applicationEnd}
                                    </span>
                                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                                      Internship: {term.internshipStart} → {term.internshipEnd}
                                    </span>
                                  </div>
                                </div>
                                {form.termId === term.id && !eligibilityError && (
                                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* STU-02: Eligibility Error */}
                    {eligibilityError && form.termId && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-red-800" style={{ fontSize: "0.9rem" }}>Eligibility Check Failed</p>
                          <p className="text-red-700 mt-1" style={{ fontSize: "0.85rem" }}>{eligibilityError}</p>
                        </div>
                      </div>
                    )}

                    {/* STU-02: Eligibility Success */}
                    {form.termId && !eligibilityError && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-emerald-800" style={{ fontSize: "0.9rem" }}>You are eligible!</p>
                          <p className="text-emerald-700 mt-1" style={{ fontSize: "0.85rem" }}>
                            Your level and department match the requirements for this term. You can proceed to the next step.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 2: Company & Branch (search-first) ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h3>Find Your Company & Branch</h3>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                        Start typing the company name. Pick a match, or register a new company if none exists.
                      </p>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(e) => {
                          setCompanySearch(e.target.value);
                          // Reset selection when query changes
                          updateForm({
                            companyChoice: "none",
                            selectedCompanyId: "",
                            branchChoice: "none",
                            selectedBranchId: "",
                          });
                        }}
                        placeholder="e.g., MTN Ghana, Accra Digital Centre..."
                        className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>

                    {/* SUGGESTIONS — shown until a company is chosen */}
                    {companySearch && form.companyChoice === "none" && (
                      <div className="space-y-2">
                        {matches.length > 0 ? (
                          <>
                            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                              {matches.length} match{matches.length === 1 ? "" : "es"} found — select one or register new below.
                            </p>
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                              {matches.map(({ company: c }) => {
                                const branchCount = getBranchesForCompany(c.id).length;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() =>
                                      updateForm({
                                        companyChoice: "existing",
                                        selectedCompanyId: c.id,
                                        branchChoice: "none",
                                        selectedBranchId: "",
                                      })
                                    }
                                    className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p style={{ fontSize: "0.9rem" }}>{c.name}</p>
                                        <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                                          {c.contactPerson} · {c.contactEmail}
                                        </p>
                                        <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                                          <GitBranch className="inline w-3 h-3 mr-1" />
                                          {branchCount} branch{branchCount === 1 ? "" : "es"}
                                        </p>
                                      </div>
                                      <StatusBadge status={c.status} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="bg-secondary/30 rounded-xl p-4 text-center">
                            <Search className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                              No matching companies found for "{companySearch}".
                            </p>
                          </div>
                        )}

                        {/* "Register as new" CTA — always available unless exact dup */}
                        {!exactDup ? (
                          <button
                            onClick={() =>
                              updateForm({
                                companyChoice: "new",
                                selectedCompanyId: "",
                                newCompanyName: companySearch,
                                branchChoice: "new",
                              })
                            }
                            className="w-full p-4 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-primary"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <Plus className="w-4 h-4" />
                            Register "{companySearch}" as a new company
                          </button>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-amber-800" style={{ fontSize: "0.8rem" }}>
                              <strong>"{exactDup.name}"</strong> already exists in the system. Please select it from the suggestions above and add a branch instead of creating a duplicate.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SCENARIO 1: existing company chosen → branch picker */}
                    {form.companyChoice === "existing" && selectedCompany && (
                      <div className="space-y-4">
                        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p style={{ fontSize: "0.95rem" }}>{selectedCompany.name}</p>
                              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                                {selectedCompany.contactPerson} · {selectedCompany.contactEmail}
                              </p>
                              <div className="mt-1"><StatusBadge status={selectedCompany.status} /></div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              updateForm({ companyChoice: "none", selectedCompanyId: "", branchChoice: "none", selectedBranchId: "" });
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Change
                          </button>
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 mb-2">
                            <GitBranch className="w-4 h-4 text-primary" />
                            Select a Branch
                          </h4>
                          <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8rem" }}>
                            Choose where you'll be doing your attachment, or add a new branch if it isn't listed.
                          </p>

                          <div className="space-y-2">
                            {branchesForSelected.length === 0 && (
                              <p className="text-muted-foreground italic" style={{ fontSize: "0.8rem" }}>
                                No branches recorded yet. Add the first one below.
                              </p>
                            )}
                            {branchesForSelected.map((b) => (
                              <button
                                key={b.id}
                                onClick={() =>
                                  updateForm({ branchChoice: "existing", selectedBranchId: b.id })
                                }
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                  form.branchChoice === "existing" && form.selectedBranchId === b.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p style={{ fontSize: "0.85rem" }}>{b.name}</p>
                                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                                      {b.location}, {b.region} · {b.telephone}
                                    </p>
                                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                                      {b.address}
                                    </p>
                                  </div>
                                  <StatusBadge status={b.status} />
                                </div>
                              </button>
                            ))}

                            <button
                              onClick={() =>
                                updateForm({ branchChoice: "new", selectedBranchId: "" })
                              }
                              className={`w-full p-3 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                                form.branchChoice === "new"
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border hover:border-primary/40 text-muted-foreground"
                              }`}
                              style={{ fontSize: "0.85rem" }}
                            >
                              <Plus className="w-4 h-4" /> Add a New Branch
                            </button>
                          </div>
                        </div>

                        {form.branchChoice === "new" && (
                          <div className="space-y-4 border-t border-border pt-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                              <p className="text-amber-800" style={{ fontSize: "0.8rem" }}>
                                New branches require DLO approval. The branch will be created with status <strong>Pending</strong>.
                              </p>
                            </div>
                            <BranchFieldsBlock
                              form={form}
                              updateForm={updateForm}
                              dupWarning={
                                newBranchDup
                                  ? `A branch named "${newBranchDup.name}" already exists for this company.`
                                  : undefined
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* SCENARIO 2: brand-new company → company + first branch in one form */}
                    {form.companyChoice === "new" && (
                      <div className="space-y-4">
                        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Plus className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p style={{ fontSize: "0.9rem" }}>Registering a new company</p>
                              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                                Both the company and its first branch will be sent for DLO approval.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              updateForm({
                                companyChoice: "none",
                                newCompanyName: "",
                                newCompanyContactPerson: "",
                                newCompanyContactEmail: "",
                                branchChoice: "none",
                              })
                            }
                            className="text-muted-foreground hover:text-foreground"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Company fields */}
                        <div>
                          <h4 className="mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Company Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label style={{ fontSize: "0.8rem" }}>Company Name *</label>
                              <input
                                type="text"
                                value={form.newCompanyName}
                                onChange={(e) => updateForm({ newCompanyName: e.target.value })}
                                placeholder="e.g., Accra Digital Centre"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                                style={{ fontSize: "0.85rem" }}
                              />
                              {newCompanyDup && (
                                <p className="text-amber-700 mt-1 flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  "{newCompanyDup.name}" already exists. Please go back and select it instead.
                                </p>
                              )}
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem" }}>Contact Person *</label>
                              <div className="relative mt-1">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={form.newCompanyContactPerson}
                                  onChange={(e) => updateForm({ newCompanyContactPerson: e.target.value })}
                                  placeholder="Name of contact"
                                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
                                  style={{ fontSize: "0.85rem" }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem" }}>Contact Email *</label>
                              <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                  type="email"
                                  value={form.newCompanyContactEmail}
                                  onChange={(e) => updateForm({ newCompanyContactEmail: e.target.value })}
                                  placeholder="email@company.com"
                                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
                                  style={{ fontSize: "0.85rem" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* First branch fields */}
                        <div className="border-t border-border pt-4">
                          <h4 className="mb-3 flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> First Branch Details</h4>
                          <BranchFieldsBlock form={form} updateForm={updateForm} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 3: Details & Optional Documents (STU-05) ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h3>Your Details & Documents</h3>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                        Provide contact information and optionally upload supporting documents.
                      </p>
                    </div>

                    {/* Auto-filled */}
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                      <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>AUTO-FILLED FROM PROFILE</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          ["Full Name", user?.name || ""],
                          ["Student ID", user?.studentId || ""],
                          ["Department", user?.department || ""],
                          ["Email", user?.email || ""],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{l}</p>
                            <p style={{ fontSize: "0.85rem" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label style={{ fontSize: "0.8rem" }}>Phone Number *</label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type="tel" value={form.phoneNumber} onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                            placeholder="+233..." className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem" }}>Preferred Start Date</label>
                        <input type="date" value={form.preferredStartDate} onChange={(e) => updateForm({ preferredStartDate: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem" }}>Emergency Contact Name *</label>
                        <input type="text" value={form.emergencyContact} onChange={(e) => updateForm({ emergencyContact: e.target.value })}
                          placeholder="e.g., Mrs. Akua Doe" className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem" }}>Emergency Contact Phone *</label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type="tel" value={form.emergencyPhone} onChange={(e) => updateForm({ emergencyPhone: e.target.value })}
                            placeholder="+233..." className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label style={{ fontSize: "0.8rem" }}>Additional Notes</label>
                        <textarea value={form.additionalNotes} onChange={(e) => updateForm({ additionalNotes: e.target.value })}
                          placeholder="Any special requirements, health concerns, or other relevant information..." rows={3}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background" style={{ fontSize: "0.85rem" }} />
                      </div>
                    </div>

                    {/* STU-05: Optional Document Uploads */}
                    <div className="border-t border-border pt-5">
                      <h4 className="flex items-center gap-2 mb-1">
                        <Upload className="w-4 h-4 text-primary" />
                        Optional Supporting Documents
                      </h4>
                      <p className="text-muted-foreground mb-4" style={{ fontSize: "0.8rem" }}>
                        You may upload a CV and/or motivation letter to strengthen your application. These are not required.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* CV Upload */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                            form.uploadCV ? "border-emerald-400 bg-emerald-50" : "border-border hover:border-primary/40"
                          }`}
                          onClick={() => updateForm({ uploadCV: !form.uploadCV })}
                        >
                          {form.uploadCV ? (
                            <>
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                              <p style={{ fontSize: "0.85rem" }} className="text-emerald-700">CV_John_Doe.pdf</p>
                              <p className="text-emerald-600 mt-1" style={{ fontSize: "0.7rem" }}>Click to remove</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                              <p style={{ fontSize: "0.85rem" }}>Upload CV / Resume</p>
                              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.7rem" }}>PDF, DOC · Max 5MB</p>
                            </>
                          )}
                        </div>

                        {/* Motivation Letter Upload */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                            form.uploadMotivation ? "border-emerald-400 bg-emerald-50" : "border-border hover:border-primary/40"
                          }`}
                          onClick={() => updateForm({ uploadMotivation: !form.uploadMotivation })}
                        >
                          {form.uploadMotivation ? (
                            <>
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                              <p style={{ fontSize: "0.85rem" }} className="text-emerald-700">Motivation_Letter.pdf</p>
                              <p className="text-emerald-600 mt-1" style={{ fontSize: "0.7rem" }}>Click to remove</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                              <p style={{ fontSize: "0.85rem" }}>Upload Motivation Letter</p>
                              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.7rem" }}>PDF, DOC · Max 5MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Review & Submit (STU-06) ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h3>Review Your Application</h3>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
                        Please review all details before submitting. You won't be able to edit after submission.
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Internship Window</p>
                        <p style={{ fontSize: "0.9rem" }}>{selectedTerm?.name || "—"}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                          {selectedTerm?.type} · {selectedTerm?.internshipStart} → {selectedTerm?.internshipEnd}
                        </p>
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Company</p>
                        {form.companyChoice === "existing" ? (
                          <>
                            <p style={{ fontSize: "0.9rem" }}>{selectedCompany?.name || "—"}</p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                              {selectedCompany?.contactPerson} · {selectedCompany?.contactEmail}
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: "0.9rem" }}>
                              {form.newCompanyName}{" "}
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "0.6rem" }}>PENDING APPROVAL</span>
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                              {form.newCompanyContactPerson} · {form.newCompanyContactEmail}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Branch</p>
                        {form.branchChoice === "existing" && selectedBranch ? (
                          <>
                            <p style={{ fontSize: "0.9rem" }}>{selectedBranch.name}</p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                              {selectedBranch.location}, {selectedBranch.region}
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                              {selectedBranch.address} · {selectedBranch.telephone}
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: "0.9rem" }}>
                              {form.newBranchName}{" "}
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "0.6rem" }}>PENDING</span>
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                              {form.newBranchLocation}, {form.newBranchRegion}
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                              {form.newBranchAddress} · {form.newBranchTelephone}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Student</p>
                        <p style={{ fontSize: "0.9rem" }}>{user?.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                          {user?.studentId} · {user?.department} · {form.phoneNumber}
                        </p>
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                        <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Emergency Contact</p>
                        <p style={{ fontSize: "0.9rem" }}>{form.emergencyContact}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{form.emergencyPhone}</p>
                      </div>
                    </div>

                    {/* Documents Summary */}
                    {(form.uploadCV || form.uploadMotivation) && (
                      <div className="bg-secondary/30 rounded-xl p-4">
                        <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: "0.65rem" }}>Attached Documents</p>
                        <div className="flex gap-3">
                          {form.uploadCV && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg" style={{ fontSize: "0.8rem" }}>
                              <FileText className="w-3.5 h-3.5 text-primary" /> CV_John_Doe.pdf
                            </span>
                          )}
                          {form.uploadMotivation && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg" style={{ fontSize: "0.8rem" }}>
                              <FileText className="w-3.5 h-3.5 text-primary" /> Motivation_Letter.pdf
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {form.additionalNotes && (
                      <div className="bg-secondary/30 rounded-xl p-4">
                        <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: "0.65rem" }}>Additional Notes</p>
                        <p style={{ fontSize: "0.85rem" }}>{form.additionalNotes}</p>
                      </div>
                    )}

                    {/* What happens next */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-800 mb-2" style={{ fontSize: "0.85rem" }}>What happens after submission:</p>
                      <ol className="text-blue-700 space-y-1" style={{ fontSize: "0.8rem" }}>
                        <li>1. Your application status will be set to <strong>"Pending Departmental Review"</strong></li>
                        <li>2. Your DLO will be notified and will review your application</li>
                        {form.companyChoice === "new" && <li>3. Your new company will be reviewed and approved/rejected separately</li>}
                        <li>{form.companyChoice === "new" ? "4" : "3"}. You can track your application status in the "My Application" tab</li>
                      </ol>
                    </div>

                    {/* Terms Agreement */}
                    <div className="border border-border rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.agreeToTerms}
                          onChange={(e) => updateForm({ agreeToTerms: e.target.checked })}
                          className="accent-primary w-5 h-5 mt-0.5 shrink-0"
                        />
                        <span className="text-foreground" style={{ fontSize: "0.85rem" }}>
                          I confirm that all information provided is accurate and complete. I understand that providing false information may result in my application being rejected. I agree to follow the Industrial Attachment guidelines set by Ho Technical University.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => step === 1 ? setView("windows") : setStep((step - 1) as Step)}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent"
                  style={{ fontSize: "0.85rem" }}
                >
                  <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Back to Windows" : "Previous"}
                </button>

                <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                  Step {step} of 4
                </p>

                {step < 4 ? (
                  <button
                    onClick={() => canProceed() && setStep((step + 1) as Step)}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Application
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ VIEW: APPLICATION TRACKER (STU-07) ═══════ */}
      {view === "tracker" && (
        <div className="space-y-5">
          {!myApp ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3>No Application Found</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                You have not submitted an application yet. Browse open internship windows and apply.
              </p>
              <button
                onClick={() => setView("windows")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                View Open Windows
              </button>
            </div>
          ) : (
            <>
              {/* Current Status Banner */}
              <div className={`rounded-xl p-5 border ${
                myApp.status === "Active" ? "bg-emerald-50 border-emerald-200" :
                myApp.status === "Completed" ? "bg-blue-50 border-blue-200" :
                myApp.status === "Rejected" ? "bg-red-50 border-red-200" :
                "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>CURRENT STATUS</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={myApp.status} />
                      <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                        since {myApp.dateApplied}
                      </span>
                    </div>
                  </div>
                  {myApp.status === "Pending" && (
                    <p className="text-amber-700" style={{ fontSize: "0.8rem" }}>
                      Your application is awaiting departmental review by the DLO.
                    </p>
                  )}
                </div>
              </div>

              {/* Pre-internship Journey Panel — only while internship hasn't started */}
              {!["Active", "Completed"].includes(myApp.status) && (
                <ApplicationJourney
                  app={myApp}
                  term={store.terms.find(
                    (t) =>
                      myApp.dateApplied >= t.applicationStart &&
                      myApp.dateApplied <= t.applicationEnd &&
                      (t.departments.includes(myApp.department) || t.departments.length === 0)
                  )}
                />
              )}

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <h3>Application Info</h3>
                  {[
                    ["Student Name", myApp.studentName],
                    ["Student ID", myApp.studentId],
                    ["Department", myApp.department],
                    ["Level", myApp.level],
                    ["Date Applied", myApp.dateApplied],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{l}</p>
                      <p style={{ fontSize: "0.85rem" }}>{v}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Status</p>
                    <StatusBadge status={myApp.status} />
                  </div>
                  {myApp.grade && (
                    <div>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Grade</p>
                      <span className="px-3 py-1 bg-secondary rounded-lg" style={{ fontSize: "0.9rem" }}>{myApp.grade}</span>
                      {myApp.gradeStatus && <span className="ml-2"><StatusBadge status={myApp.gradeStatus} /></span>}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <h3>Company & Branch</h3>
                  {(() => {
                    const company = store.companies.find((c) => c.id === myApp.companyId);
                    const branch = myApp.branchId ? store.branches.find((b) => b.id === myApp.branchId) : undefined;
                    if (!company) return <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>Company information unavailable.</p>;
                    const rows: [string, string | undefined][] = [
                      ["Company", company.name],
                      ["Contact", company.contactPerson],
                      ["Email", company.contactEmail],
                    ];
                    if (branch) {
                      rows.push(
                        ["Branch", branch.name],
                        ["Region", branch.region],
                        ["Location", branch.location],
                        ["Address", branch.address],
                        ["Phone", branch.telephone],
                      );
                    } else if (company.address || company.contactPhone) {
                      rows.push(["Address", company.address], ["Phone", company.contactPhone]);
                    }
                    return (
                      <>
                        {rows.filter(([, v]) => !!v).map(([l, v]) => (
                          <div key={l}>
                            <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">{l}</p>
                            <p style={{ fontSize: "0.85rem" }}>{v}</p>
                          </div>
                        ))}
                        <div>
                          <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Company Status</p>
                          <StatusBadge status={company.status} />
                        </div>
                        {branch && (
                          <div>
                            <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Branch Status</p>
                            <StatusBadge status={branch.status} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {myApp.supervisorAssigned && (
                    <div>
                      <p style={{ fontSize: "0.7rem" }} className="text-muted-foreground uppercase tracking-wider">Academic Supervisor</p>
                      <p style={{ fontSize: "0.85rem" }}>{myApp.supervisorAssigned}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* STU-07: Status Change History with Timestamps */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <History className="w-5 h-5 text-primary" />
                  <h3>Status History</h3>
                </div>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {statusHistory.map((entry, i) => {
                      const isLatest = i === statusHistory.length - 1;
                      const timestamp = new Date(entry.timestamp);
                      const dateStr = timestamp.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                      const timeStr = timestamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            isLatest ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-emerald-500 text-white"
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 bg-secondary/20 rounded-xl p-3.5">
                            <div className="flex items-center justify-between mb-1">
                              <p className={isLatest ? "text-foreground" : ""} style={{ fontSize: "0.9rem" }}>
                                {entry.status}
                                {isLatest && (
                                  <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded" style={{ fontSize: "0.65rem" }}>
                                    CURRENT
                                  </span>
                                )}
                              </p>
                              <div className="text-right shrink-0">
                                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{dateStr}</p>
                                <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{timeStr}</p>
                              </div>
                            </div>
                            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{entry.description}</p>
                            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.7rem" }}>By: {entry.actor}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending future steps */}
                    {!["Completed"].includes(myApp.status) && (
                      <>
                        {!["Approved", "Company Accepted", "Active", "Completed"].includes(myApp.status) && (
                          <div className="flex items-start gap-4 relative opacity-40">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-muted text-muted-foreground">
                              <span style={{ fontSize: "0.7rem" }}>?</span>
                            </div>
                            <div className="flex-1 bg-secondary/10 rounded-xl p-3.5 border border-dashed border-border">
                              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>Pending: Departmental Review</p>
                            </div>
                          </div>
                        )}
                        {!["Active", "Completed"].includes(myApp.status) && ["Approved", "Company Accepted"].includes(myApp.status) && (
                          <div className="flex items-start gap-4 relative opacity-40">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-muted text-muted-foreground">
                              <span style={{ fontSize: "0.7rem" }}>?</span>
                            </div>
                            <div className="flex-1 bg-secondary/10 rounded-xl p-3.5 border border-dashed border-border">
                              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>Upcoming: Internship Starts</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-4 relative opacity-40">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-muted text-muted-foreground">
                            <span style={{ fontSize: "0.7rem" }}>?</span>
                          </div>
                          <div className="flex-1 bg-secondary/10 rounded-xl p-3.5 border border-dashed border-border">
                            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>Upcoming: Completion & Grading</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Timeline (Visual) */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="mb-4">Progress Overview</h3>
                <div className="flex items-center gap-0">
                  {[
                    { label: "Submitted", done: true },
                    { label: "Company OK", done: myApp.companyStatus === "Approved" },
                    { label: "Approved", done: ["Approved", "Company Accepted", "Active", "Completed"].includes(myApp.status) },
                    { label: "Accepted", done: ["Company Accepted", "Active", "Completed"].includes(myApp.status) },
                    { label: "Supervisor", done: !!myApp.supervisorAssigned },
                    { label: "Active", done: myApp.status === "Active" || myApp.status === "Completed" },
                    { label: "Done", done: myApp.status === "Completed" },
                  ].map((s, i, arr) => (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          s.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span style={{ fontSize: "0.65rem" }}>{i + 1}</span>}
                        </div>
                        <p className={`mt-1.5 text-center ${s.done ? "text-foreground" : "text-muted-foreground"}`} style={{ fontSize: "0.65rem" }}>
                          {s.label}
                        </p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${s.done ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-internship Journey panel — shows the full pipeline from submission to start day.
function ApplicationJourney({
  app,
  term,
}: {
  app: {
    status: string;
    companyStatus: string;
    supervisorAssigned?: string;
    dateApplied: string;
    companyName: string;
    branchName?: string;
  };
  term?: { name: string; internshipStart: string; internshipEnd: string };
}) {
  const status = app.status;
  const companyApproved = app.companyStatus === "Approved";
  const isApproved = ["Approved", "Company Accepted", "Active", "Completed"].includes(status);
  const isCompanyAccepted = ["Company Accepted", "Active", "Completed"].includes(status);
  const hasSupervisor = !!app.supervisorAssigned;
  const isRejected = status === "Rejected";

  const stages: {
    title: string;
    description: string;
    state: "done" | "current" | "upcoming" | "blocked";
    actor: string;
  }[] = [
    {
      title: "Application Submitted",
      description: `Submitted on ${app.dateApplied} for ${app.companyName}${app.branchName ? ` — ${app.branchName}` : ""}.`,
      state: "done",
      actor: "You",
    },
    {
      title: "Company Verification",
      description: companyApproved
        ? "Your chosen company is verified in the system."
        : "DLO is verifying that the company exists and is suitable.",
      state: companyApproved ? "done" : status === "Pending" ? "current" : "upcoming",
      actor: "DLO",
    },
    {
      title: "Departmental Review",
      description: isRejected
        ? "Your application was rejected. Please contact your DLO."
        : isApproved
          ? "Your DLO approved the application and issued a placement letter."
          : "Your DLO is reviewing your application.",
      state: isRejected ? "blocked" : isApproved ? "done" : companyApproved && status === "Pending" ? "current" : "upcoming",
      actor: "DLO",
    },
    {
      title: "Company Acceptance",
      description: isCompanyAccepted
        ? "The company signed the acceptance form. Your placement is confirmed."
        : "Take the placement letter to your company. They sign and return the acceptance form.",
      state: isCompanyAccepted ? "done" : isApproved ? "current" : "upcoming",
      actor: "You + Company",
    },
    {
      title: "Academic Supervisor Assigned",
      description: hasSupervisor
        ? `${app.supervisorAssigned} will visit and evaluate you during the internship.`
        : "Your DLO will assign an academic supervisor before the internship starts.",
      state: hasSupervisor ? "done" : isCompanyAccepted ? "current" : "upcoming",
      actor: "DLO",
    },
    {
      title: "Internship Starts",
      description: term
        ? `Begin your attachment on ${term.internshipStart} at ${app.companyName}${app.branchName ? ` (${app.branchName})` : ""}.`
        : `Begin your attachment at ${app.companyName}${app.branchName ? ` (${app.branchName})` : ""}.`,
      state: status === "Active" || status === "Completed" ? "done" : hasSupervisor && isCompanyAccepted ? "current" : "upcoming",
      actor: "You",
    },
  ];

  const completed = stages.filter((s) => s.state === "done").length;
  const total = stages.length;
  const progressPct = Math.round((completed / total) * 100);
  const currentStage = stages.find((s) => s.state === "current");

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Your Application Journey
          </h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8rem" }}>
            {term ? <>Working towards <strong>{term.name}</strong> · starts {term.internshipStart}</> : "Pipeline from submission to internship start"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>PROGRESS</p>
          <p style={{ fontSize: "1.1rem" }} className="text-primary">{progressPct}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-muted-foreground mb-5" style={{ fontSize: "0.75rem" }}>
        Step {completed + (currentStage ? 1 : 0)} of {total}
        {currentStage && <> · Currently: <span className="text-foreground">{currentStage.title}</span></>}
      </p>

      {/* Vertical journey */}
      <div className="relative">
        <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-border" />
        <div className="space-y-4">
          {stages.map((s, i) => {
            const iconBg =
              s.state === "done"
                ? "bg-emerald-500 text-white"
                : s.state === "current"
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : s.state === "blocked"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground";
            const wrapTone =
              s.state === "current"
                ? "border-primary/30 bg-primary/5"
                : s.state === "blocked"
                  ? "border-red-200 bg-red-50/50"
                  : s.state === "done"
                    ? "border-border bg-card"
                    : "border-dashed border-border bg-secondary/10 opacity-70";

            return (
              <div key={i} className="flex items-start gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${iconBg}`}>
                  {s.state === "done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : s.state === "blocked" ? (
                    <X className="w-4 h-4" />
                  ) : s.state === "current" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <span style={{ fontSize: "0.75rem" }}>{i + 1}</span>
                  )}
                </div>
                <div className={`flex-1 rounded-xl border p-3.5 ${wrapTone}`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p style={{ fontSize: "0.9rem" }}>
                      {s.title}
                      {s.state === "current" && (
                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded" style={{ fontSize: "0.6rem" }}>
                          IN PROGRESS
                        </span>
                      )}
                      {s.state === "blocked" && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded" style={{ fontSize: "0.6rem" }}>
                          BLOCKED
                        </span>
                      )}
                    </p>
                    <span className="text-muted-foreground shrink-0" style={{ fontSize: "0.7rem" }}>{s.actor}</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Shared input grid for branch fields — used in both "add branch to existing company"
// and "register new company with first branch" flows.
function BranchFieldsBlock({
  form,
  updateForm,
  dupWarning,
}: {
  form: FormData;
  updateForm: (u: Partial<FormData>) => void;
  dupWarning?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label style={{ fontSize: "0.8rem" }}>Branch Name *</label>
        <input
          type="text"
          value={form.newBranchName}
          onChange={(e) => updateForm({ newBranchName: e.target.value })}
          placeholder="e.g., Head Office, Kumasi Branch"
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
          style={{ fontSize: "0.85rem" }}
        />
        {dupWarning && (
          <p className="text-amber-700 mt-1 flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
            <AlertCircle className="w-3.5 h-3.5" /> {dupWarning}
          </p>
        )}
      </div>
      <div>
        <label style={{ fontSize: "0.8rem" }}>Region *</label>
        <select
          value={form.newBranchRegion}
          onChange={(e) => updateForm({ newBranchRegion: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
          style={{ fontSize: "0.85rem" }}
        >
          {ghanaRegions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "0.8rem" }}>Location (Town/City) *</label>
        <input
          type="text"
          value={form.newBranchLocation}
          onChange={(e) => updateForm({ newBranchLocation: e.target.value })}
          placeholder="e.g., Accra, Ho, Kumasi"
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
          style={{ fontSize: "0.85rem" }}
        />
      </div>
      <div>
        <label style={{ fontSize: "0.8rem" }}>Telephone Number *</label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            value={form.newBranchTelephone}
            onChange={(e) => updateForm({ newBranchTelephone: e.target.value })}
            placeholder="+233..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <label style={{ fontSize: "0.8rem" }}>Branch Address *</label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={form.newBranchAddress}
            onChange={(e) => updateForm({ newBranchAddress: e.target.value })}
            placeholder="Full street address"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
      </div>
    </div>
  );
}
