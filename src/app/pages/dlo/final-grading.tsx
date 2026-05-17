import { useState } from "react";
import { useAppContext } from "../../lib/context";
import {
  getActiveConfig, hasActiveConfig, getCompiledGrade,
  getReportScore, getPresentationScore,
  submitReportScore, submitPresentationScore,
} from "../../services/grading-service";
import { NumericScoreForm } from "../../components/grading/numeric-score-form";
import { GradeBreakdownCard } from "../../components/grading/grade-breakdown-card";
import { StatusBadge } from "../../components/status-badge";
import type { GradingActor } from "../../types/grading";
import { useNavigate } from "react-router";
import { FileText, Mic, AlertTriangle, ChevronLeft, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export function DLOFinalGradingPage() {
  const { user, store } = useAppContext();
  const navigate = useNavigate();
  const dept = user?.department || "Computer Science";
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const configActive = hasActiveConfig(dept);
  const config = getActiveConfig(dept);

  const deptApps = store.applications.filter(
    (a) => a.department === dept && (a.status === "Active" || a.status === "Completed")
  );

  const selected = selectedAppId ? deptApps.find((a) => a.id === selectedAppId) : null;

  const actor: GradingActor = {
    id: user?.id ?? "u-dlo",
    name: user?.name ?? "DLO",
    role: "dlo",
    department: dept,
  };

  // ── List view ──
  if (!selected) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Final Grading</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {dept} · Enter Attachment Report and/or Presentation scores per the department's active grading structure.
          </p>
        </div>

        {!configActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-800" style={{ fontSize: "0.85rem" }}>
                No approved grading configuration exists for {dept}.
              </p>
              <p className="text-amber-700 mt-1" style={{ fontSize: "0.75rem" }}>
                Configure the grading structure and submit it for HOD approval before final grades can be compiled.
              </p>
              <button
                onClick={() => navigate("/dlo/settings")}
                className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:opacity-90"
                style={{ fontSize: "0.8rem" }}
              >
                Open Grading Configuration
              </button>
            </div>
          </div>
        )}

        {configActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800" style={{ fontSize: "0.85rem" }}>
              Active structure: <strong>Structure {config.structure}</strong> — weights{" "}
              Industrial {config.structureWeights.w1}%, Departmental {config.structureWeights.w2}%
              {(config.structureWeights.w3 || 0) > 0 && `, Report ${config.structureWeights.w3}%`}
              {(config.structureWeights.w4 || 0) > 0 && `, Presentation ${config.structureWeights.w4}%`}.
            </p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3>Students Awaiting Final Grading</h3>
          </div>
          {deptApps.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              No active or completed students in {dept}.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Student</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Company</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Report</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Presentation</th>
                  <th className="text-left px-4 py-2.5" style={{ fontSize: "0.75rem" }}>Final</th>
                  <th className="text-right px-4 py-2.5" style={{ fontSize: "0.75rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {deptApps.map((app) => {
                  const r = getReportScore(app.id);
                  const p = getPresentationScore(app.id);
                  const c = getCompiledGrade(app.id);
                  return (
                    <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                        <div>
                          <p>{app.studentName}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{app.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>{app.companyName}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                        {r ? `${r.score}/100` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                        {p ? `${p.score}/100` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.85rem" }}>
                        {c?.finalPercent !== null && c?.finalPercent !== undefined
                          ? `${c.finalPercent}%`
                          : <StatusBadge status="Pending" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Per-student detail ──
  const compiled = getCompiledGrade(selected.id);
  const report = getReportScore(selected.id);
  const presentation = getPresentationScore(selected.id);

  const needsReport =
    (config.structure === "A" || config.structure === "C" || config.structure === "D") &&
    (config.structureWeights.w3 || 0) > 0;
  const needsPresentation =
    (config.structure === "B" || config.structure === "C" || config.structure === "D") &&
    (config.structureWeights.w4 || 0) > 0;

  const handleReport = (score: number, comments: string) => {
    const res = submitReportScore(selected.id, score, comments, actor);
    res.success ? toast.success(res.message) : toast.error(res.message);
    setRefreshTick((t) => t + 1);
  };
  const handlePresentation = (score: number, comments: string) => {
    const res = submitPresentationScore(selected.id, score, comments, actor);
    res.success ? toast.success(res.message) : toast.error(res.message);
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6" key={refreshTick}>
      <button
        onClick={() => setSelectedAppId(null)}
        className="flex items-center gap-2 text-primary hover:underline"
        style={{ fontSize: "0.85rem" }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to list
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1>{selected.studentName}</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
            {selected.studentId} · {selected.companyName} · Structure {config.structure}
          </p>
        </div>
      </div>

      {compiled?.blockedReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800" style={{ fontSize: "0.85rem" }}>{compiled.blockedReason}</p>
        </div>
      )}

      {compiled && (
        <GradeBreakdownCard compiled={compiled} studentName={selected.studentName} />
      )}

      {!needsReport && !needsPresentation && (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Structure {config.structure} doesn't require Report or Presentation scoring for this department.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {needsReport && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3>Attachment Report</h3>
            </div>
            <NumericScoreForm
              title="Attachment Report Score"
              helper={`Score out of 100 for the final written report. Weight in final grade: ${config.structureWeights.w3}%.`}
              initialScore={report?.score}
              initialComments={report?.comments}
              submitLabel={report ? "Update Report Score" : "Submit Report Score"}
              onSubmit={handleReport}
            />
          </div>
        )}

        {needsPresentation && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-primary" />
              <h3>Final Presentation</h3>
            </div>
            <NumericScoreForm
              title="Final Presentation Score"
              helper={`Score out of 100 for the oral presentation. Weight in final grade: ${config.structureWeights.w4}%.`}
              initialScore={presentation?.score}
              initialComments={presentation?.comments}
              submitLabel={presentation ? "Update Presentation Score" : "Submit Presentation Score"}
              onSubmit={handlePresentation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
