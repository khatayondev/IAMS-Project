import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useAppContext } from "../../lib/context";
import { normalizeApiUser } from "../../lib/context";
import { apiClient } from "../../lib/api-client";
import { getRoutePrefix } from "../../services/auth-service";
import { GraduationCap, CheckCircle, XCircle, Loader2, User, Phone, Briefcase, Building2 } from "lucide-react";
import { toast } from "sonner";

type Stage = "form" | "submitting" | "success" | "error";

export function MagicLinkPage() {
  const { setUser } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const emailFromUrl = searchParams.get("email") ?? "";
  const studentName = searchParams.get("student") ?? "";
  const companyName = searchParams.get("company") ?? "";

  const [stage, setStage] = useState<Stage>(token ? "form" : "error");
  const [errorMsg, setErrorMsg] = useState(
    token ? "" : "No invitation token found. This link may be invalid or already used."
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const handleAccept = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    setStage("submitting");
    try {
      const res = await apiClient.loginWithToken(token, emailFromUrl, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        job_title: jobTitle.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setStage("error");
        setErrorMsg(res.message ?? "This invitation link has expired or has already been used.");
        return;
      }

      const rawUser = (res.data as any).user ?? res.data;
      const user = normalizeApiUser(rawUser);
      setUser(user);
      setStage("success");
      toast.success(`Welcome, ${user.name}! Your account has been created.`);
      setTimeout(() => navigate(getRoutePrefix(user.role), { replace: true }), 1500);
    } catch {
      setStage("error");
      setErrorMsg("Could not reach the server. Please check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">HTU Attachment System</h1>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
              Industry Supervisor Invitation
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 space-y-5 shadow-sm border border-border">
          {/* ── Form stage ── */}
          {stage === "form" && (
            <>
              {/* Invitation context */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <p className="font-medium text-blue-900" style={{ fontSize: "0.85rem" }}>
                  You've been invited as an Industry Supervisor
                </p>
                {(studentName || companyName) && (
                  <p className="text-blue-700" style={{ fontSize: "0.78rem" }}>
                    {studentName && <>For student: <strong>{studentName}</strong></>}
                    {studentName && companyName && " · "}
                    {companyName && (
                      <><Building2 className="inline w-3 h-3 mr-0.5" /><strong>{companyName}</strong></>
                    )}
                  </p>
                )}
                {emailFromUrl && (
                  <p className="text-blue-600" style={{ fontSize: "0.78rem" }}>
                    Invitation sent to: <strong>{emailFromUrl}</strong>
                  </p>
                )}
              </div>

              <p className="text-muted-foreground" style={{ fontSize: "0.82rem" }}>
                Complete your profile below to activate your supervisor account. You only need to do this once.
              </p>

              {/* Name */}
              <div className="space-y-1">
                <label className="block font-medium" style={{ fontSize: "0.8rem" }}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-input-background"
                    style={{ fontSize: "0.85rem" }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block font-medium" style={{ fontSize: "0.8rem" }}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-input-background"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Job title */}
              <div className="space-y-1">
                <label className="block font-medium" style={{ fontSize: "0.8rem" }}>
                  Job Title / Position
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-input-background"
                    style={{ fontSize: "0.85rem" }}
                    onKeyDown={(e) => e.key === "Enter" && handleAccept()}
                  />
                </div>
              </div>

              <button
                onClick={handleAccept}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
                style={{ fontSize: "0.88rem" }}
              >
                Accept &amp; Activate Account
              </button>

              <p className="text-center text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                After activation you can sign in anytime using Google at{" "}
                <Link to="/login" className="text-primary hover:underline">
                  the login page
                </Link>
                .
              </p>
            </>
          )}

          {/* ── Submitting ── */}
          {stage === "submitting" && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-medium" style={{ fontSize: "0.95rem" }}>Creating your account…</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem" }}>
                  Please wait a moment.
                </p>
              </div>
            </div>
          )}

          {/* ── Success ── */}
          {stage === "success" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <div>
                <p className="font-medium" style={{ fontSize: "0.95rem" }}>Account activated!</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem" }}>
                  Redirecting to your dashboard…
                </p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {stage === "error" && (
            <div className="text-center space-y-4 py-2">
              <XCircle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <p className="font-medium" style={{ fontSize: "0.95rem" }}>Invitation invalid or expired</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem" }}>
                  {errorMsg}
                </p>
              </div>
              <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                Ask the student or DLO to resend your invitation, then click the new link.
              </p>
              <Link
                to="/login"
                className="inline-block text-primary hover:underline"
                style={{ fontSize: "0.82rem" }}
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
