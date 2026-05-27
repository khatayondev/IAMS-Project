import { useState } from "react";
import { GraduationCap, AlertCircle, Loader2, ClipboardList, Users, BarChart3 } from "lucide-react";
import { apiClient } from "../../lib/api-client";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.getGoogleAuthUrl();
      const url = (res.data as any)?.url as string | undefined;
      if (!res.success || !url) {
        setError(res.message ?? "Could not start Google sign-in. Please try again.");
        return;
      }
      window.location.href = url;
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* ── Left image panel (desktop) / full-screen background (mobile) ── */}
      <div className="absolute inset-0 lg:relative lg:inset-auto lg:flex-[0_0_58%] overflow-hidden">
        <img
          src={BG_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark overlay — heavier on mobile for text legibility */}
        <div className="absolute inset-0 bg-black/60 lg:bg-black/50" />

        {/* Desktop branding content */}
        <div className="hidden lg:flex relative h-full flex-col justify-between p-14 text-white">
          {/* Top: logo mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-wide" style={{ fontSize: "1rem" }}>
              HTU · IAMS
            </span>
          </div>

          {/* Bottom: tagline + feature bullets */}
          <div className="space-y-6">
            <div>
              <h2 className="font-bold leading-tight" style={{ fontSize: "2.2rem" }}>
                Empowering<br />Tomorrow's<br />Professionals
              </h2>
              <p className="mt-3 text-white/70 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                Ho Technical University's industrial attachment portal — connecting students,
                supervisors and departments in one place.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                { icon: ClipboardList, text: "Track applications & approvals end-to-end" },
                { icon: Users,         text: "Coordinate supervisors across departments" },
                { icon: BarChart3,     text: "Real-time attendance & grading insights" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/80" style={{ fontSize: "0.83rem" }}>
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-screen p-6 lg:bg-background">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo + title (not shown on desktop — desktop branding is on the left) */}
          <div className="text-center text-white lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="mt-3 font-bold" style={{ fontSize: "1.2rem" }}>
              HTU Attachment System
            </h1>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.82rem" }}>
              Industrial Attachment Management Portal
            </p>
          </div>

          {/* Desktop title (shown on right panel, above card) */}
          <div className="hidden lg:block">
            <h2 className="font-bold" style={{ fontSize: "1.6rem" }}>Sign in</h2>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
              Use your Google account to access the portal
            </p>
          </div>

          {/* Login card */}
          <div
            className="rounded-2xl p-7 space-y-5 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* On desktop override to solid card via inline style above; already clean */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors disabled:opacity-60 font-medium text-gray-800 shadow-sm"
              style={{ fontSize: "0.9rem" }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? "Redirecting…" : "Sign in with Google"}
            </button>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-700" style={{ fontSize: "0.8rem" }}>{error}</p>
              </div>
            )}

            <p className="text-center text-gray-500" style={{ fontSize: "0.73rem" }}>
              HTU staff, students &amp; supervisors all sign in here.
              <br />
              First-time supervisors: check your email for your invitation link.
            </p>
          </div>

          {/* Footer note (mobile) */}
          <p className="text-center text-white/50 lg:hidden" style={{ fontSize: "0.72rem" }}>
            © {new Date().getFullYear()} Ho Technical University
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
