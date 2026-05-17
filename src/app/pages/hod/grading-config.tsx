import { useMemo } from "react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { GradingConfigForm } from "../../components/grading/grading-config-form";
import { useAppContext } from "../../lib/context";
import { getConfigForEditing, approveConfig } from "../../services/grading-service";
import type { GradingActor } from "../../types/grading";
import { CheckCircle2 } from "lucide-react";

export function HODGradingConfigPage() {
  const { user, store } = useAppContext();
  const _ = store.gradingConfigs.length;

  const department = user?.department ?? "Computer Science";
  const config = useMemo(() => getConfigForEditing(department), [department, store.gradingConfigs]);

  const actor: GradingActor = {
    id: user?.id ?? "u-hod",
    name: user?.name ?? "HOD",
    role: "hod",
    department,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-[#1a1a2e]">Grading Configuration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Read-only view of {department}'s grading configuration. Approve a pending submission to lock it for the term.
          </p>
        </div>
        <StatusBadge status={config.status} />
      </div>

      <Card className="p-4 text-sm text-gray-600">
        <div>
          <span className="text-gray-500">Drafted by:</span> {config.createdBy}
        </div>
        {config.submittedForApprovalBy && (
          <div className="mt-1">
            <span className="text-gray-500">Submitted for approval by:</span>{" "}
            {config.submittedForApprovalBy} · {config.submittedForApprovalAt && new Date(config.submittedForApprovalAt).toLocaleString()}
          </div>
        )}
        {config.approvedBy && (
          <div className="mt-1">
            <span className="text-gray-500">Approved by:</span>{" "}
            {config.approvedBy} · {config.approvedAt && new Date(config.approvedAt).toLocaleString()}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <GradingConfigForm initial={config} readOnly />
      </Card>

      {config.status === "pending_approval" && (
        <div className="flex justify-end">
          <Button
            className="bg-[#0B5ED7] hover:bg-[#0a52bd]"
            onClick={() => {
              const res = approveConfig(config.id, actor);
              res.success ? toast.success(res.message) : toast.error(res.message);
            }}
          >
            <CheckCircle2 className="size-4 mr-2" />
            Approve & Lock for Term
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
    draft: "Draft (not yet submitted)",
    pending_approval: "Pending Your Approval",
    active: "Active & Locked",
  };
  return <Badge className={map[status]}>{label[status]}</Badge>;
}
