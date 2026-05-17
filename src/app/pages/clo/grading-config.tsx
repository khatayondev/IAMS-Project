import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { GradingConfigForm } from "../../components/grading/grading-config-form";
import { useAppContext } from "../../lib/context";
import { departments } from "../../lib/mock-data";
import { getConfigForEditing, saveDraft, submitForApproval, startNewTerm } from "../../services/grading-service";
import type { GradingActor } from "../../types/grading";
import { Send, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

export function CLOGradingConfigPage() {
  const { user, store } = useAppContext();
  const _ = store.gradingConfigs.length;

  const [department, setDepartment] = useState<string>(departments[0]);
  const config = useMemo(() => getConfigForEditing(department), [department, store.gradingConfigs]);

  const actor: GradingActor = {
    id: user?.id ?? "u-clo",
    name: user?.name ?? "CLO",
    role: "clo",
  };

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(
    config.status === "draft" ? config.id : undefined
  );

  const isLocked = config.status === "active";
  const isPending = config.status === "pending_approval";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1a1a2e]">Grading Configuration (Super Admin)</h1>
          <p className="text-sm text-gray-600 mt-1">
            As CLO you can configure any department's grading. Select a department below. Changes still require HOD approval to lock.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50">
              <RefreshCw className="size-4 mr-2" />
              Start New Term
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Start a new term?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the current active term as <strong>Completed</strong> and promote the next
                upcoming term to <strong>Active</strong>. Each department will then need to draft and have
                their grading configuration re-approved by the HOD for the new term. Previously approved
                configs and grades remain frozen as historical record. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  const res = startNewTerm(actor);
                  res.success ? toast.success(res.message) : toast.error(res.message);
                  setSavedDraftId(undefined);
                }}
              >
                Yes, Start New Term
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-sm">
            <Select value={department} onValueChange={(v) => { setDepartment(v); setSavedDraftId(undefined); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <StatusBadge status={config.status} />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Last updated by {config.updatedBy} · {new Date(config.updatedAt).toLocaleString()}
        </div>
      </Card>

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
