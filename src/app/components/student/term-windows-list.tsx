import { Calendar, Info, ArrowRight, Clock, Shield, Building2 } from "lucide-react";

interface Term {
  id: string;
  name: string;
  status: string;
  type: string;
  applicationStart: string;
  applicationEnd: string;
  internshipStart: string;
  internshipEnd: string;
  eligibleLevels: string[];
  departments: string[];
}

interface TermWindowsListProps {
  availableTerms: Term[];
  onSelectTerm: (termId: string) => void;
  onViewChange: (view: "windows" | "apply" | "tracker") => void;
}

export function TermWindowsList({
  availableTerms,
  onSelectTerm,
  onViewChange,
}: TermWindowsListProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0 dark:text-blue-400" />
        <div>
          <p className="text-blue-800 dark:text-blue-300" style={{ fontSize: "0.85rem" }}>
            Below are the internship terms currently open or upcoming. Click on a term to view eligibility and apply.
          </p>
        </div>
      </div>

      {availableTerms.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3>No Open Windows</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
            There are no active or upcoming internship windows at this time. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableTerms.map((term) => {
            const today = new Date().toISOString().split("T")[0];
            const appStart = term.applicationStart ?? "";
            const appEnd = term.applicationEnd ?? "";
            const isOpen = appStart && appEnd && today >= appStart && today <= appEnd;
            const daysLeft = isOpen && appEnd
              ? Math.max(
                  0,
                  Math.ceil((new Date(appEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                )
              : null;

            const termName = String(term.name ?? "Term");
            const termStatus = String(term.status ?? "Upcoming");
            const termType = String(term.type ?? "Unknown");

            const statusColorMap: Record<string, { border: string; bgLight: string; text: string; icon: string }> = {
              active: { border: "border-l-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", icon: "✓" },
              upcoming: { border: "border-l-blue-500", bgLight: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", icon: "⏱" },
              completed: { border: "border-l-gray-500", bgLight: "bg-gray-50 dark:bg-gray-950/20", text: "text-gray-700 dark:text-gray-400", icon: "✔" },
              archived: { border: "border-l-gray-500", bgLight: "bg-gray-50 dark:bg-gray-950/20", text: "text-gray-700 dark:text-gray-400", icon: "📦" },
            };
            const statusLower = termStatus.toLowerCase();
            const statusStyle = statusColorMap[statusLower] || statusColorMap.upcoming;

            return (
              <div
                key={term.id}
                className={`bg-card border-l-4 ${statusStyle.border} border-t border-r border-b border-border rounded-2xl overflow-hidden hover:shadow-[0_4px_16px_rgba(11,94,215,0.12)] transition-all`}
              >
                <div className={`${statusStyle.bgLight} p-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{termName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.text} bg-white dark:bg-background`}>
                          {statusStyle.icon} {termStatus}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${statusStyle.text}`}>
                        {termType === "Semestrial" ? "📚 Semestrial Internship" : "🏖️ Vacation Internship"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTerm(term.id);
                        onViewChange("apply");
                      }}
                      disabled={!isOpen}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm shrink-0 ${
                        isOpen
                          ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {isOpen ? (
                        <>
                          Apply Now <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>Not Open Yet</>
                      )}
                    </button>
                  </div>

                  {/* Days Left Alert */}
                  {isOpen && daysLeft !== null && daysLeft <= 7 && (
                    <div className="mb-4 p-3 bg-red-100/80 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-300 font-semibold text-sm">
                        ⏰ {daysLeft} day{daysLeft !== 1 ? "s" : ""} left to apply
                      </p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="border-t border-border/50 pt-4">
                    {(() => {
                      const intStart = term.internshipStart ??"—";
                      const intEnd = term.internshipEnd ?? "—";
                      const levelNames = (term.eligibleLevels ?? []).map((l: any) =>
                        typeof l === "string" ? l : (l.name ?? l.code ?? String(l))
                      );
                      const depts = (term.departments ?? []).map((d: any) =>
                        typeof d === "string" ? d : (d.name ?? String(d))
                      );
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white dark:bg-background/40 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-muted-foreground">Application</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{appStart || "—"}</p>
                              <p className="text-xs text-muted-foreground">to {appEnd || "—"}</p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-background/40 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-muted-foreground">Internship</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{intStart}</p>
                              <p className="text-xs text-muted-foreground">to {intEnd}</p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-background/40 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-muted-foreground">Levels</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {levelNames.length > 0 ? levelNames.map((l) => (
                                <span key={String(l)} className="px-2 py-1 bg-primary/10 text-primary rounded font-medium text-xs">
                                  {String(l)}
                                </span>
                              )) : <span className="text-muted-foreground text-xs">—</span>}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-background/40 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-muted-foreground">Departments</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {depts.length > 0 ? depts.map((d) => (
                                <span key={d} className="px-2 py-1 bg-primary/10 text-primary rounded font-medium text-xs">
                                  {d}
                                </span>
                              )) : <span className="text-muted-foreground text-xs">—</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
