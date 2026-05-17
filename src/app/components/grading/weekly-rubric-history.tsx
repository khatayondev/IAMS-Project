import { useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { getWeeksForApplication, getWeeklyRubrics } from "../../services/grading-service";
import { WEEKLY_RUBRIC_CRITERIA } from "../../lib/constants";
import { useAppContext } from "../../lib/context";

interface Props {
  applicationId: string;
}

/**
 * Read-only timeline of weekly rubric submissions for an attachment.
 * Used by the DLO and Academic Supervisor to review qualitative progress.
 */
export function WeeklyRubricHistory({ applicationId }: Props) {
  const { store } = useAppContext();
  const _ = store.weeklyRubrics.length;
  const [expanded, setExpanded] = useState<number | null>(null);

  const weeks = useMemo(() => getWeeksForApplication(applicationId), [applicationId, store.applications.length, store.terms.length]);
  const entries = getWeeklyRubrics(applicationId);
  const byWeek = new Map(entries.map((e) => [e.weekNumber, e]));

  if (weeks.length === 0) {
    return (
      <Card className="p-4 text-sm text-gray-600">
        No attachment date range available for this student.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-700">
          {entries.length} of {weeks.length} weeks submitted
        </div>
        <div className="text-xs text-gray-500">Qualitative — not scored</div>
      </div>
      {weeks.map((w) => {
        const e = byWeek.get(w.weekNumber);
        const isOpen = expanded === w.weekNumber;
        return (
          <Card key={w.weekNumber} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : w.weekNumber)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="size-4 text-gray-500" /> : <ChevronRight className="size-4 text-gray-500" />}
                <span className="text-sm text-[#1a1a2e]">
                  Week {w.weekNumber}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(w.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} —{" "}
                  {new Date(w.weekEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
              {e ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-0">
                  <CheckCircle2 className="size-3 mr-1" /> Submitted
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <AlertCircle className="size-3 mr-1" /> Pending
                </Badge>
              )}
            </button>
            {isOpen && e && (
              <div className="px-3 pb-3 border-t bg-gray-50/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                  {WEEKLY_RUBRIC_CRITERIA.map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.label}</span>
                      <span className="text-[#0B5ED7]">{e.ratings[c.key] ?? "—"}</span>
                    </div>
                  ))}
                </div>
                {e.notes && (
                  <div className="mt-3 text-sm text-gray-700 bg-white border rounded p-2">
                    <span className="text-gray-500 text-xs">Notes:</span> {e.notes}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Submitted by {e.submittedBy} on {new Date(e.submittedAt).toLocaleString()}
                </div>
              </div>
            )}
            {isOpen && !e && (
              <div className="px-3 pb-3 border-t bg-gray-50/40 text-sm text-gray-600 pt-3">
                The Industrial Supervisor has not submitted a rubric for this week yet.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
