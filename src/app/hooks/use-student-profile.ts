import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";

export interface StudentProfileData {
  id?: string | number;
  userId?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  department?: string;
  departmentName?: string;
  program?: string;
  level?: string;
  languages?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyPhone?: string;
  preferredIndustries?: string;
  desiredRoles?: string;
  profileCompleted?: boolean;
  lastUpdated?: string;
}

const PROFILE_STORAGE_KEY = (userId: string | number) => `student_profile_${userId}`;
const PROFILE_METADATA_KEY = (userId: string | number) => `student_profile_meta_${userId}`;

export function useStudentProfile(userId?: string | number, enabled = true) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveToLocalStorage = useCallback((data: StudentProfileData) => {
    if (!userId) return;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY(userId), JSON.stringify(data));
      localStorage.setItem(PROFILE_METADATA_KEY(userId), JSON.stringify({
        lastSynced: new Date().toISOString(),
        version: 1,
      }));
      console.log("Profile saved to localStorage");
    } catch (e) {
      console.warn("Failed to save profile to localStorage:", e);
    }
  }, [userId]);

  const loadFromLocalStorage = useCallback((): StudentProfileData | null => {
    if (!userId) return null;
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY(userId));
      if (stored) {
        console.log("Loaded profile from localStorage");
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load profile from localStorage:", e);
    }
    return null;
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) return;

    setLoading(true);
    setError(null);

    try {
      // Always fetch from API first (API is source of truth for multi-device persistence)
      const res = await apiClient.getStudentProfile(String(userId));
      if (res.success && res.data) {
        const apiProfile: StudentProfileData = {
          id: res.data.id,
          userId: res.data.user_id || userId,
          name: res.data.name || res.data.user?.name,
          email: res.data.user?.email,
          phone: res.data.phone,
          studentId: res.data.student_id,
          department: res.data.department,
          departmentName: res.data.department_name,
          program: res.data.program,
          level: String(res.data.level || "200"),
          languages: res.data.languages,
          emergencyContact: res.data.emergency_contact_name || res.data.emergency_contact,
          emergencyContactName: res.data.emergency_contact_name,
          emergencyContactPhone: res.data.emergency_contact_phone,
          emergencyPhone: res.data.emergency_contact_phone,
          preferredIndustries: res.data.preferred_industries,
          desiredRoles: res.data.desired_roles,
          profileCompleted: res.data.profile_completed,
          lastUpdated: new Date().toISOString(),
        };
        setProfile(apiProfile);
        saveToLocalStorage(apiProfile);
      } else {
        // API failed, try to load from cache as fallback
        const cached = loadFromLocalStorage();
        if (cached) {
          setProfile(cached);
        } else {
          setError(res.message || "Failed to load profile");
        }
      }
    } catch (err) {
      // API error, try fallback to cache
      const cached = loadFromLocalStorage();
      if (cached) {
        setProfile(cached);
        console.warn("Using cached profile due to API error:", err);
      } else {
        setError(err instanceof Error ? err.message : "Error loading profile");
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, userId, loadFromLocalStorage, saveToLocalStorage]);

  // Load on mount
  useEffect(() => {
    refresh();
  }, [userId, enabled, refresh]);

  const updateProfile = useCallback(async (updates: Partial<StudentProfileData>) => {
    if (!userId) return;

    // Update local state immediately
    const updated = { ...profile, ...updates, lastUpdated: new Date().toISOString() };
    setProfile(updated);
    saveToLocalStorage(updated);

    // Sync with API
    try {
      const res = await apiClient.updateStudent(String(userId), updates);
      if (res.success) {
        console.log("Profile updated on server");
      } else {
        setError("Failed to sync profile with server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  }, [userId, profile, saveToLocalStorage]);

  const clearCache = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY(userId));
      localStorage.removeItem(PROFILE_METADATA_KEY(userId));
      setProfile(null);
      console.log("Profile cache cleared");
    } catch (e) {
      console.warn("Failed to clear profile cache:", e);
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refresh,
    updateProfile,
    clearCache,
  };
}
