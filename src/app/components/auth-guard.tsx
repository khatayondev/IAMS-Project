import { Navigate, useLocation } from "react-router";
import { useAppContext } from "../lib/context";
import type { ExtendedRole } from "../services/auth-service";

interface AuthGuardProps {
  allowedRoles: ExtendedRole[];
  children: React.ReactNode;
}

/**
 * RBAC middleware component.
 * Checks if the current user has the required role.
 * If not authenticated → redirect to login.
 * If wrong role → redirect to their own dashboard.
 */
export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const { user } = useAppContext();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own portal
    const prefix =
      user.role === "clo"
        ? "/clo"
        : user.role === "dlo"
          ? "/dlo"
          : user.role === "academic"
            ? "/academic"
            : user.role === "hod"
              ? "/hod"
              : user.role === "student"
                ? "/student"
                : "/supervisor";
    return <Navigate to={prefix} replace />;
  }

  return <>{children}</>;
}
