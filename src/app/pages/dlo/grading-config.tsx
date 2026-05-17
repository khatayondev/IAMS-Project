import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { GradingConfigForm } from "../../components/grading/grading-config-form";
import { useAppContext } from "../../lib/context";
import { getConfigForEditing, saveDraft, submitForApproval } from "../../services/grading-service";
import type { GradingActor } from "../../types/grading";
import { Send } from "lucide-react";

export function DLOGradingConfigPage() {
  const { user, store } = useAppContext();
  // store dependency keeps this re-rendering on mutations
  const _ = store.gradingConfigs.length;

  const department = user?.department ?? "Computer Science";
  const config = useMemo(() => getConfigForEditing(department), [department, store.gradingConfigs]);

  const actor: GradingActor = {
    id: user?.id ?? "u-dlo",
    name: user?.name ?? "DLO",
    role: "dlo",
    department,
  };

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(
    config.status === "draft" ? config.id : undefined
  );

  const isLocked = config.status === "active";
  const isPending = config.status === "pending_approval";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-[#1a1a2e]">Grading Configuration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure how attachment grades are calculated for {department}. The HOD must approve before it locks for the term.
          </p>
        </div>
        <StatusBadge status={config.status} />
      </div>

      {isLocked && (
        <Card className="p-4 border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-900">
            This configuration is locked for the active term. Changes are only possible at the start of a new term.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <GradingConfigForm
          initial={config}
          readOnly={isLocked}
          onSave={(input) => {
            const res = saveDraft({ departmentId: department, ...input }, actor);
            if (res.success && res.data) {
              setSavedDraftId(res.data.id);
              toast.success(res.message);
            } else {
              toast.error(res.message);
            }
          }}
        />
      </Card>

      {!isLocked && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={!savedDraftId || isPending}
            onClick={() => {
              if (!savedDraftId) return;
              const res = submitForApproval(savedDraftId, actor);
              res.success ? toast.success(res.message) : toast.error(res.message);
            }}
          >
            <Send className="size-4 mr-2" />
            Submit to HOD for Approval
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending_approval: "bg-yellow-100 text-yellow-800",
    active: "bg-emerald-100 text-emerald-800",
  };
  const label: Record<string, string> = {
    draft: "Draft",
    pending_approval: "Pending HOD Approval",
    active: "Active & Locked",
  };
  return <Badge className={map[status]}>{label[status]}</Badge>;
}
