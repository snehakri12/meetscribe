"use client";

import { useCallback, useState } from "react";

import type { ActionItemChanges } from "@/components/action-items/ActionItemRow";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api, errorMessage } from "@/lib/api";
import type { ActionItem } from "@/lib/types";

type Handlers = {
  onUpdated: (item: ActionItem) => void;
  onDeleted: (itemId: number) => void;
};

/** Update / delete action items with toasts and a delete confirmation dialog. */
export function useActionItemMutations({ onUpdated, onDeleted }: Handlers) {
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<ActionItem | null>(null);

  const update = useCallback(
    async (item: ActionItem, changes: ActionItemChanges): Promise<boolean> => {
      try {
        const updated = await api.updateActionItem(item.id, changes);
        onUpdated(updated);
        if (changes.completed !== undefined) {
          toast.success(changes.completed ? "Action item completed" : "Action item reopened");
        } else {
          toast.success("Action item updated");
        }
        return true;
      } catch (error) {
        toast.error(errorMessage(error, "Could not update the action item"));
        return false;
      }
    },
    [onUpdated, toast],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await api.deleteActionItem(pendingDelete.id);
      onDeleted(pendingDelete.id);
      toast.success("Action item deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete the action item"));
    }
  }, [pendingDelete, onDeleted, toast]);

  const deleteDialog = (
    <ConfirmDialog
      open={pendingDelete !== null}
      title="Delete action item?"
      message={`"${pendingDelete?.title ?? ""}" will be permanently removed.`}
      confirmLabel="Delete"
      destructive
      onConfirm={confirmDelete}
      onClose={() => setPendingDelete(null)}
    />
  );

  return { update, requestDelete: setPendingDelete, deleteDialog };
}
