import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type {
  DepartmentGradingConfig,
  GradingStructure,
  StructureWeights,
  SectionWeights,
} from "../../types/grading";

interface Props {
  initial: DepartmentGradingConfig;
  readOnly?: boolean;
  onSave?: (input: {
    structure: GradingStructure;
    structureWeights: StructureWeights;
    sectionWeights: SectionWeights;
  }) => void;
  saveLabel?: string;
}

export function GradingConfigForm({ initial, readOnly, onSave, saveLabel = "Save Draft" }: Props) {
  const [structure, setStructure] = useState<GradingStructure>(initial.structure);
  const [w1, setW1] = useState(initial.structureWeights.w1);
  const [w2, setW2] = useState(initial.structureWeights.w2);
  const [w3, setW3] = useState(initial.structureWeights.w3);
  const [w4, setW4] = useState(initial.structureWeights.w4 ?? 0);
  const [sec, setSec] = useState<SectionWeights>(initial.sectionWeights);

  const includesW4 = structure === "C" || structure === "D";
  const structureSum = w1 + w2 + w3 + (includesW4 ? w4 : 0);
  const sectionSum = sec.a + sec.b + sec.c + sec.d;

  // Structure D allows W3/W4 = 0; A/B/C all require ≥ 1 on every weight.
  const w3MinOk = structure === "D" ? w3 >= 0 : w3 >= 1;
  const w4MinOk = structure === "D" ? w4 >= 0 : (structure === "C" ? w4 >= 1 : true);
  const w12Ok = w1 >= 1 && w2 >= 1;
  // Structure D: Report and Presentation may individually be 0, but at least one
  // must carry weight — otherwise the 30% Report/Presentation slice disappears.
  const dReportPresentationOk = structure === "D" ? w3 + w4 >= 1 : true;
  const structureValid = structureSum === 100 && w12Ok && w3MinOk && w4MinOk && dReportPresentationOk;
  const sectionValid = sectionSum === 100;

  function pickStructure(s: GradingStructure) {
    if (readOnly) return;
    // Per spec §5.4: changing structure clears weights → re-entry required.
    if (s !== structure) {
      setStructure(s);
      if (s === "A") { setW1(40); setW2(30); setW3(30); setW4(0); }
      else if (s === "B") { setW1(40); setW2(30); setW3(30); setW4(0); }
      else if (s === "C") { setW1(40); setW2(30); setW3(15); setW4(15); }
      else { setW1(40); setW2(30); setW3(20); setW4(10); } // D — sensible default
    }
  }

  const w3Label =
    structure === "B" ? "Presentation Weight"
    : structure === "D" ? "Report Weight (may be 0)"
    : "Report Weight";
  const w4Label = structure === "D" ? "Presentation Weight (may be 0)" : "Presentation Weight";

  return (
    <div className="space-y-6">
      {/* Structure selector */}
      <div>
        <Label className="block mb-3">Grading Structure</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["A", "B", "C", "D"] as const).map((s) => {
            const desc =
              s === "A" ? "Industrial + Departmental + Report"
              : s === "B" ? "Industrial + Departmental + Presentation"
              : s === "C" ? "Industrial + Departmental + Report + Presentation"
              : "Fully custom — all four components, Report or Presentation may be 0%";
            return (
              <Card
                key={s}
                onClick={() => pickStructure(s)}
                className={`p-4 cursor-pointer transition border-2 ${structure === s ? "border-[#0B5ED7] bg-[#E3F3FF]" : "border-transparent hover:border-gray-200"} ${readOnly ? "cursor-default" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox checked={structure === s} disabled={readOnly} className="mt-1" />
                  <div>
                    <div className="text-[#1a1a2e]">Structure {s}</div>
                    <div className="text-sm text-gray-600 mt-1">{desc}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Structure weights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Component Weights</Label>
          <span className={`text-sm ${structureValid ? "text-emerald-700" : "text-red-700"}`}>
            Total: {structureSum}% / 100%
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeightInput label="Industrial Supervisor" value={w1} onChange={setW1} disabled={readOnly} min={1} />
          <WeightInput label="Departmental Supervisor" value={w2} onChange={setW2} disabled={readOnly} min={1} />
          <WeightInput label={w3Label} value={w3} onChange={setW3} disabled={readOnly} min={structure === "D" ? 0 : 1} />
          {includesW4 && (
            <WeightInput label={w4Label} value={w4} onChange={setW4} disabled={readOnly} min={structure === "D" ? 0 : 1} />
          )}
        </div>
        {!structureValid && !readOnly && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {!w12Ok
                ? "Industrial and Departmental Supervisor weights must each be at least 1%."
                : structureSum !== 100
                  ? `Component weights must sum to exactly 100% (currently ${structureSum}%).`
                  : !dReportPresentationOk
                    ? "Structure D requires Report + Presentation weights to total at least 1% — otherwise use Structure A or B."
                    : "Each weight must satisfy its minimum (Structure D allows Report or Presentation to be 0%; A/B/C require ≥ 1%)."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Section weights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Industrial Supervisor — Section Weights</Label>
          <span className={`text-sm ${sectionValid ? "text-emerald-700" : "text-red-700"}`}>
            Total: {sectionSum}% / 100%
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          How the four sections (Specific Skills, Employability, Attitude, Human Relations) combine into the Industrial Supervisor score out of 100.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WeightInput label="A — Specific Skills" value={sec.a} onChange={(v) => setSec({ ...sec, a: v })} disabled={readOnly} />
          <WeightInput label="B — Employability" value={sec.b} onChange={(v) => setSec({ ...sec, b: v })} disabled={readOnly} />
          <WeightInput label="C — Attitude" value={sec.c} onChange={(v) => setSec({ ...sec, c: v })} disabled={readOnly} />
          <WeightInput label="D — Human Relations" value={sec.d} onChange={(v) => setSec({ ...sec, d: v })} disabled={readOnly} />
        </div>
        {!sectionValid && !readOnly && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="size-4" />
            <AlertDescription>Section weights must sum to exactly 100%.</AlertDescription>
          </Alert>
        )}
      </div>

      {!readOnly && onSave && (
        <div className="flex justify-end">
          <Button
            disabled={!structureValid || !sectionValid}
            onClick={() =>
              onSave({
                structure,
                structureWeights: includesW4
                  ? { w1, w2, w3, w4 }
                  : { w1, w2, w3 },
                sectionWeights: sec,
              })
            }
            className="bg-[#0B5ED7] hover:bg-[#0a52bd]"
          >
            <CheckCircle2 className="size-4 mr-2" /> {saveLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function WeightInput({
  label, value, onChange, disabled, min = 1,
}: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean; min?: number }) {
  return (
    <div>
      <Label className="text-sm text-gray-700">{label}</Label>
      <div className="relative mt-1">
        <Input
          type="number"
          min={min}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
          disabled={disabled}
          className="pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
      </div>
    </div>
  );
}
