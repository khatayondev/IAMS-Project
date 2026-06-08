import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event fired");
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Check if user has dismissed before
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      console.log("[PWA] User previously dismissed:", !!dismissed);
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // Log if event doesn't fire
    const timeout = setTimeout(() => {
      if (!deferredPrompt) {
        console.log("[PWA] beforeinstallprompt event did not fire within 5 seconds");
        console.log("[PWA] This is normal in development or on non-HTTPS connections");
      }
    }, 5000);

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast.success("App installed successfully! You can now use IAMS offline.");
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("Error installing app:", error);
      toast.error("Failed to install app. Please try again.");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_install_dismissed", "true");
    setShowPrompt(false);
  };

  const handleReset = () => {
    localStorage.removeItem("pwa_install_dismissed");
    setShowPrompt(true);
    setShowDebug(false);
    console.log("[PWA] Dismissed flag cleared - popup should show on next page load");
  };

  // Show debug info if PWA event hasn't fired yet
  const shouldShowDebug = showDebug || (!deferredPrompt && showPrompt === false);

  // Main install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={handleDismiss}
        />

        {/* Modal */}
        <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Download className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Install IAMS App</h2>
              <p className="text-muted-foreground text-sm">
                Install the app on your device for quick access and offline support. Get instant notifications and better performance.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Fast loading</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Home screen shortcut</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm"
              >
                Not Now
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install App
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug panel for when PWA support is unavailable
  return (
    <button
      onClick={() => setShowDebug(!showDebug)}
      className="fixed bottom-4 right-4 px-3 py-1 text-xs bg-muted border border-border rounded-lg hover:bg-accent transition-colors z-40"
      title="Click for PWA debug info"
    >
      PWA Debug
      {showDebug && (
        <div className="absolute bottom-12 right-0 w-72 bg-card border border-border rounded-lg p-4 space-y-3 shadow-lg text-left">
          <div>
            <p className="text-xs font-semibold mb-1">PWA Installation Debug</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• beforeinstallprompt: {deferredPrompt ? "✓ Received" : "✗ Not received"}</p>
              <p>• Previously dismissed: {localStorage.getItem("pwa_install_dismissed") ? "Yes" : "No"}</p>
              <p>• HTTPS: {window.location.protocol === "https:" ? "✓ Yes" : "✗ No"}</p>
              <p>• Manifest: ✓ Configured</p>
              <p>• Service Worker: {navigator.serviceWorker ? "✓ Supported" : "✗ Not supported"}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-colors"
          >
            Reset Dismissal & Show Prompt
          </button>
          <p className="text-xs text-muted-foreground">
            Note: PWA installation only works on HTTPS connections or localhost. The browser must also support the beforeinstallprompt event (Chrome, Edge, Samsung Internet on Android).
          </p>
        </div>
      )}
    </button>
  );
}
