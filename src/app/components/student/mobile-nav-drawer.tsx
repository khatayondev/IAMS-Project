import { X, Moon, Sun, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAppContext } from "../../lib/context";
import { useState } from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  BookMarked,
  TrendingUp,
  Upload,
  Award,
  AlertTriangle,
  MessageSquarePlus,
} from "lucide-react";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const studentNav = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/profile-setup", label: "My Profile", icon: User },
  { to: "/student/applications", label: "Applications", icon: FileText },
  { to: "/student/logbook", label: "Daily Logbook", icon: BookMarked },
  { to: "/student/attendance", label: "Attendance", icon: TrendingUp },
  { to: "/student/documents", label: "Documents", icon: Upload },
  { to: "/student/evaluation", label: "My Score & Evaluation", icon: Award },
  { to: "/student/history", label: "Internship History", icon: Award },
  { to: "/student/issues", label: "Report Issue", icon: AlertTriangle },
  { to: "/student/communications", label: "Communications", icon: MessageSquarePlus },
];

export function MobileNavDrawer({ isOpen, onClose, onLogout }: MobileNavDrawerProps) {
  const { user } = useAppContext();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleDarkMode = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(html.classList.contains("dark"));
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.studentId}</p>
              {user?.department && (
                <p className="text-xs text-muted-foreground truncate">{user.department}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {studentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">Dark Mode</span>
            {isDark ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
