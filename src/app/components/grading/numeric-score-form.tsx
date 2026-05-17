import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface Props {
  title: string;
  helper?: string;
  initialScore?: number;
  initialComments?: string;
  onSubmit: (score: number, comments: string) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function NumericScoreForm({
  title, helper, initialScore, initialComments = "", onSubmit, submitting, submitLabel = "Submit Score",
}: Props) {
  const [score, setScore] = useState<string>(initialScore !== undefined ? String(initialScore) : "");
  const [comments, setComments] = useState(initialComments);

  const numeric = parseFloat(score);
  const valid = Number.isFinite(numeric) && numeric >= 0 && numeric <= 100;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#1a1a2e]">{title}</Label>
        {helper && <p className="text-sm text-gray-600 mt-1">{helper}</p>}
      </div>
      <div>
        <Label htmlFor="score-input">Score (0–100)</Label>
        <Input
          id="score-input"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="score-comments">Comments</Label>
        <Textarea
          id="score-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder="Observations, justification, or notes for the record..."
          className="mt-1"
        />
      </div>
      <div className="flex justify-end">
        <Button
          disabled={!valid || submitting}
          onClick={() => onSubmit(numeric, comments)}
          className="bg-[#0B5ED7] hover:bg-[#0a52bd]"
        >
          {submitting ? "Submitting…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
