// Settings store — persists system configuration that affects business logic
// Separate from main store to keep concerns clean

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((l) => l()); }

export interface SystemSettings {
  inactivityThresholdDays: number;
  autoFlagEnabled: boolean;
  allowSelfPlacement: boolean;
  maxSupervisorLoad: number;
  darkMode: boolean;
}

let settings: SystemSettings = {
  inactivityThresholdDays: 3,
  autoFlagEnabled: true,
  allowSelfPlacement: true,
  maxSupervisorLoad: 8,
  darkMode: localStorage.getItem("darkMode") === "true",
};

export function getSettings(): SystemSettings {
  return settings;
}

export function updateSettings(updates: Partial<SystemSettings>) {
  settings = { ...settings, ...updates };
  if ("darkMode" in updates) {
    localStorage.setItem("darkMode", String(settings.darkMode));
    applyDarkMode(settings.darkMode);
  }
  notify();
}

export function subscribeSettings(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyDarkMode(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Apply on load
applyDarkMode(settings.darkMode);
