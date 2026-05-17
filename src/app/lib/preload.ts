// Route preloading utility
// After login, preload the dashboard module for the user's role so it's instant

import type { ExtendedRole } from "../services/auth-service";

const preloadMap: Record<ExtendedRole, () => Promise<any>> = {
  clo: () => import("../pages/clo/dashboard"),
  dlo: () => import("../pages/dlo/dashboard"),
  student: () => import("../pages/student/dashboard"),
  supervisor: () => import("../pages/supervisor/dashboard"),
  academic: () => import("../pages/academic/dashboard"),
  hod: () => import("../pages/hod/dashboard"),
};

/**
 * Call after successful login to preload the user's dashboard chunk.
 * Uses requestIdleCallback so it doesn't compete with navigation rendering.
 */
export function preloadDashboard(role: ExtendedRole) {
  const loader = preloadMap[role];
  if (!loader) return;

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => loader());
  } else {
    setTimeout(() => loader(), 100);
  }
}
