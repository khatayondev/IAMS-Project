import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { INDUSTRIAL_CRITERIA, RATING_LABELS, SECTION_LABELS } from "../../lib/constants";
import { calculateIndustrialScore } from "../../services/grading-service";
import type { CriterionRating, SectionWeights } from "../../types/grading";

interface Props {
  sectionWeights: SectionWeights;
  initialRatings?: Record<string, CriterionRating>;
  initialComments?: string;
  onSubmit: (ratings: Record<string, CriterionRating>, comments: string) => void;
  submitting?: boolean;
}

export function IndustrialAssessmentForm({
  sectionWeights, initialRatings = {}, initialComments = "", onSubmit, submitting,
}: Props) {
  const [ratings, setRatings] = useState<Record<string, CriterionRating>>(initialRatings);
  const [comments, setComments] = useState(initialComments);

  const liveScore = useMemo(
    () => calculateIndustrialScore(ratings, sectionWeights),
    [ratings, sectionWeights]
  );

  const allRated = INDUSTRIAL_CRITERIA.every((c) => ratings[c.key]);
  const sections: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-[#E3F3FF] border-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-700">Live Computed Score</div>
            <div className="text-2xl text-[#0B5ED7]">{liveScore.toFixed(2)} / 100</div>
          </div>
          <div className="text-sm text-gray-700">
            {INDUSTRIAL_CRITERIA.filter((c) => ratings[c.key]).length} / {INDUSTRIAL_CRITERIA.length} rated
          </div>
        </div>
      </Card>

      {sections.map((sec) => (
        <div key={sec}>
          <div className="flex items-center justify-between mb-3">
            <Label>Section {sec} — {SECTION_LABELS[sec]}</Label>
            <span className="text-sm text-gray-600">Weight: {(sectionWeights as any)[sec.toLowerCase()]}%</span>
          </div>
          <div className="space-y-2">
            {INDUSTRIAL_CRITERIA.filter((c) => c.section === sec).map((c) => (
              <Card key={c.key} className="p-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-[#1a1a2e]">{c.key}. {c.label}</div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = ratings[c.key] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRatings({ ...ratings, [c.key]: n as CriterionRating })}
                          title={RATING_LABELS[n as 1 | 2 | 3 | 4 | 5]}
                          className={`w-9 h-9 rounded-md border text-sm transition ${
                            active
                              ? "bg-[#0B5ED7] text-white border-[#0B5ED7]"
                              : "border-gray-300 text-gray-700 hover:border-[#0B5ED7]"
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div>
        <Label htmlFor="ind-comments">Overall Comments</Label>
        <Textarea
          id="ind-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder="Optional summary of the student's performance during the attachment..."
          className="mt-1"
        />
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!allRated || submitting}
          onClick={() => onSubmit(ratings, comments)}
          className="bg-[#0B5ED7] hover:bg-[#0a52bd]"
        >
          {submitting ? "Submitting…" : "Submit Assessment"}
        </Button>
      </div>
      {!allRated && (
        <p className="text-sm text-gray-600 text-right">All {INDUSTRIAL_CRITERIA.length} criteria must be rated before submitting.</p>
      )}
    </div>
  );
}
