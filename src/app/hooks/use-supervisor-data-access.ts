import { useAppContext } from "../lib/context";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";

/**
 * Supervisor Data Access Control Hook
 *
 * Ensures supervisors can ONLY access data for their assigned students.
 * Validates every data fetch and filters results client-side as security layer.
 */

export interface SupervisorAssignment {
  internship_id: string | number;
  student_id: string | number;
  student_name: string;
  company_id?: string | number;
}

export function useSupervisorDataAccess() {
  const { user } = useAppContext();
  const [assignedInternships, setAssignedInternships] = useState<Set<string | number>>(
    new Set()
  );
  const [assignedStudents, setAssignedStudents] = useState<Set<string | number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  // Load supervisor's assigned students on mount
  useEffect(() => {
    if (!user?.id || user.role !== "supervisor") {
      setLoading(false);
      return;
    }

    loadAssignments();
  }, [user?.id, user?.role]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      // Get dashboard which returns assigned internships
      const dashRes = await apiClient.getDashboard("industry-supervisor");

      if (dashRes.success && dashRes.data) {
        const dashboard = dashRes.data;
        const internshipIds = new Set<string | number>();
        const studentIds = new Set<string | number>();

        // Extract assigned internship and student IDs
        const internships = dashboard.assigned_internships || [];
        internships.forEach((i: any) => {
          if (i.id) internshipIds.add(i.id);
          if (i.student_id) studentIds.add(i.student_id);
          if (i.student?.id) studentIds.add(i.student.id);
        });

        setAssignedInternships(internshipIds);
        setAssignedStudents(studentIds);
      }
    } catch (error) {
      console.error("Error loading supervisor assignments:", error);
      // Clear assignments on error for safety
      setAssignedInternships(new Set());
      setAssignedStudents(new Set());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if supervisor has access to a specific student
   */
  const canAccessStudent = (studentId: string | number | undefined): boolean => {
    if (!studentId) return false;
    return assignedStudents.has(studentId);
  };

  /**
   * Check if supervisor has access to a specific internship
   */
  const canAccessInternship = (internshipId: string | number | undefined): boolean => {
    if (!internshipId) return false;
    return assignedInternships.has(internshipId);
  };

  /**
   * Filter an array of items to only include assigned students/internships
   */
  const filterByAssignedStudents = <T extends Record<string, any>>(
    items: T[],
    studentIdField: keyof T = "student_id" as keyof T
  ): T[] => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => {
      const studentId = item[studentIdField];
      return canAccessStudent(studentId);
    });
  };

  const filterByAssignedInternships = <T extends Record<string, any>>(
    items: T[],
    internshipIdField: keyof T = "internship_id" as keyof T
  ): T[] => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => {
      const internshipId = item[internshipIdField];
      return canAccessInternship(internshipId);
    });
  };

  /**
   * Verify a single item before allowing access
   */
  const verifyAccess = (item: any, studentIdField = "student_id"): boolean => {
    const studentId = item?.[studentIdField] || item?.student?.id;
    return canAccessStudent(studentId);
  };

  /**
   * Assert access - throws error if denied
   */
  const assertAccess = (item: any, itemName = "Item", studentIdField = "student_id") => {
    if (!verifyAccess(item, studentIdField)) {
      console.error(`[SECURITY] Unauthorized access attempt to ${itemName}`, item);
      throw new Error(`You do not have access to this ${itemName}`);
    }
  };

  return {
    // State
    loading,
    assignedInternships,
    assignedStudents,

    // Access checks
    canAccessStudent,
    canAccessInternship,
    verifyAccess,
    assertAccess,

    // Filtering
    filterByAssignedStudents,
    filterByAssignedInternships,

    // Refresh assignments
    refreshAssignments: loadAssignments,
  };
}
