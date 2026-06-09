import { useEffect } from "react";
import { useAppContext } from "../lib/context";
import { useNavigate } from "react-router";

interface StudentProfileGuardProps {
  children: React.ReactNode;
}

/**
 * Student Profile Guard
 * Checks if student has completed their profile setup.
 * If not, redirects to profile setup page.
 */
export function StudentProfileGuard({ children }: StudentProfileGuardProps) {
  const { user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Only apply guard to students
    if (user?.role !== "student") {
      return;
    }

    // Check if profile is already marked as complete
    const isProfileComplete = localStorage.getItem(`student_profile_complete_${user?.id}`);

    // Only redirect if profile is NOT marked complete
    if (!isProfileComplete) {
      const currentPath = window.location.pathname;
      // Allow access to profile-setup page only
      if (!currentPath.includes("/student/profile-setup")) {
        navigate("/student/profile-setup", { replace: true });
      }
    }
  }, [user, navigate]);

  return <>{children}</>;
}
