import { createContext, useContext, useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { AuthUser, ExtendedRole } from "../services/auth-service";
import { subscribe, getState, type StoreState } from "./store";

interface AppContextType {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  store: StoreState;
}

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  sidebarOpen: true,
  setSidebarOpen: () => {},
  store: getState(),
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Subscribe to store changes for reactivity
  const store = useSyncExternalStore(subscribe, getState, getState);

  return (
    <AppContext.Provider value={{ user, setUser, sidebarOpen, setSidebarOpen, store }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

// Convenience hook for role checking
export function useRole(): ExtendedRole | null {
  const { user } = useAppContext();
  return user?.role ?? null;
}