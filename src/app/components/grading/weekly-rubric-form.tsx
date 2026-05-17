import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import {
  WEEKLY_RUBRIC_CRITERIA,
  WEEKLY_RUBRIC_4PT_OPTIONS,
  WEEKLY_RUBRIC_3PT_OPTIONS,
} from "../../lib/constants";
import type {
  WeeklyRubricRatings,
  WeeklyRubric4PtRating,
  WeeklyRubric3PtRating,
} from "../../types/grading";

interface Props {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  initialRatings?: WeeklyRubricRatings;
  initialNotes?: string;
  onSubmit: (ratings: WeeklyRubricRatings, notes: string) => void;
  readOnly?: boolean;
  submittedBy?: string;
  submittedAt?: string;
}

export function WeeklyRubricForm({
  weekNumber, weekStart, weekEnd, initialRatings = {}, initialNotes = "",
  onSubmit, readOnly, submittedBy, submittedAt,
}: Props) {
  const [ratings, setRatings] = useState<WeeklyRubricRatings>(initialRatings);
  const [notes, setNotes] = useState(initialNotes);

  const allFilled = WEEKLY_RUBRIC_CRITERIA.every((c) => ratings[c.key]);

  function setRating(key: keyof WeeklyRubricRatings, value: WeeklyRubric4PtRating | WeeklyRubric3PtRating) {
    if (readOnly) return;
    setRatings({ ...ratings, [key]: value as any });
  }

  return (
    <div className="space-y-5">
      <Card className="p-4 bg-[#E3F3FF] border-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm text-gray-700">Week {weekNumber}</div>
            <div className="text-[#0B5ED7]">
              {new Date(weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} —{" "}
              {new Date(weekEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
          <div className="text-sm text-gray-700">
            Qualitative — not scored
          </div>
        </div>
        {readOnly && submittedBy && submittedAt && (
          <div className="text-xs text-gray-600 mt-2">
            Submitted by {submittedBy} on {new Date(submittedAt).toLocaleString()}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {WEEKLY_RUBRIC_CRITERIA.map((c, idx) => {
          const options = c.scale === "4pt" ? WEEKLY_RUBRIC_4PT_OPTIONS : WEEKLY_RUBRIC_3PT_OPTIONS;
          const current = ratings[c.key];
          return (
            <Card key={c.key} className="p-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-[#1a1a2e]">{idx + 1}. {c.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {c.scale === "4pt" ? "4-point scale" : "3-point scale"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const active = current === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={readOnly}
                        onClick={() => setRating(c.key, opt)}
                        className={`px-3 py-1.5 rounded-md border text-sm transition ${
                          active
                            ? "bg-[#0B5ED7] text-white border-[#0B5ED7]"
                            : "border-gray-300 text-gray-700 hover:border-[#0B5ED7]"
                        } ${readOnly ? "cursor-default opacity-90" : ""}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <Label htmlFor={`wr-notes-${weekNumber}`}>Notes (optional)</Label>
        <Textarea
          id={`wr-notes-${weekNumber}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          disabled={readOnly}
          placeholder="Brief notes on the student's progress this week..."
          className="mt-1"
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button
            disabled={!allFilled}
            onClick={() => onSubmit(ratings, notes)}
            className="bg-[#0B5ED7] hover:bg-[#0a52bd]"
          >
            Save Week {weekNumber}
          </Button>
        </div>
      )}
      {!readOnly && !allFilled && (
        <p className="text-sm text-gray-600 text-right">All 6 criteria must be rated before saving.</p>
      )}
    </div>
  );
}
