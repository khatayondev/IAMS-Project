import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { CompiledGrade } from "../../types/grading";

interface Props {
  compiled: CompiledGrade;
  studentName?: string;
}

export function GradeBreakdownCard({ compiled, studentName }: Props) {
  const { components, configSnapshot: cfg, finalPercent, status } = compiled;
  const w = cfg.structureWeights;

  const rows: Array<{ label: string; score?: number; weight: number; contribution?: number }> = [
    { label: "Industrial Supervisor", score: components.industrial, weight: w.w1 },
    { label: "Departmental Supervisor", score: components.departmental, weight: w.w2 },
  ];
  if (cfg.structure === "A") {
    rows.push({ label: "Attachment Report", score: components.report, weight: w.w3 });
  } else if (cfg.structure === "B") {
    rows.push({ label: "Presentation", score: components.presentation, weight: w.w3 });
  } else if (cfg.structure === "C") {
    rows.push({ label: "Attachment Report", score: components.report, weight: w.w3 });
    rows.push({ label: "Presentation", score: components.presentation, weight: w.w4 || 0 });
  } else {
    // Structure D — only show components that carry a non-zero weight.
    if ((w.w3 || 0) > 0) rows.push({ label: "Attachment Report", score: components.report, weight: w.w3 });
    if ((w.w4 || 0) > 0) rows.push({ label: "Presentation", score: components.presentation, weight: w.w4 || 0 });
  }
  rows.forEach((r) => {
    if (r.score !== undefined) r.contribution = (r.score * r.weight) / 100;
  });

  const statusColor =
    status === "Approved" ? "bg-emerald-100 text-emerald-800"
    : status === "Submitted" ? "bg-blue-100 text-blue-800"
    : "bg-yellow-100 text-yellow-800";

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          {studentName && <div className="text-[#1a1a2e]">{studentName}</div>}
          <div className="text-sm text-gray-600">
            Structure {cfg.structure} · {cfg.departmentId}
          </div>
        </div>
        <Badge className={statusColor}>{status}</Badge>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
            <div className="flex-1">
              <div className="text-[#1a1a2e]">{r.label}</div>
              <div className="text-xs text-gray-500">Weight: {r.weight}%</div>
            </div>
            <div className="text-right">
              <div className="text-[#1a1a2e]">
                {r.score !== undefined ? `${r.score.toFixed(2)} / 100` : <span className="text-gray-400">Pending</span>}
              </div>
              {r.contribution !== undefined && (
                <div className="text-xs text-gray-500">+{r.contribution.toFixed(2)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-[#1a1a2e]">Final Score</div>
        <div className="text-2xl text-[#0B5ED7]">
          {finalPercent !== null ? `${finalPercent.toFixed(2)}%` : "—"}
        </div>
      </div>
    </Card>
  );
}
