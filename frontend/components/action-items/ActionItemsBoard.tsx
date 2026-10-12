"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/States";
import { useActionItemMutations } from "@/hooks/useActionItemMutations";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { CURRENT_USER } from "@/lib/constants";
import type { ActionItem, ActionItemWithMeeting } from "@/lib/types";
import { ActionItemRow } from "./ActionItemRow";

type StatusFilter = "open" | "completed" | "all";

export function ActionItemsBoard() {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [mineOnly, setMineOnly] = useState(false);
  const items = useApi(() => api.listActionItems(status), `action-items-${status}`);
  const participants = useApi(() => api.listParticipants(), "participants");
  const assigneeOptions = (participants.data ?? []).map((p) => p.name);

  const { mutate } = items;
  const onUpdated = useCallback(
    (updated: ActionItem) =>
      mutate((list) =>
        list
          .map((item): ActionItemWithMeeting => (item.id === updated.id ? { ...item, ...updated } : item))
          // Keep the list consistent with the selected status filter.
          .filter((item) => status === "all" || item.completed === (status === "completed")),
      ),
    [mutate, status],
  );
  const onDeleted = useCallback((id: number) => mutate((list) => list.filter((item) => item.id !== id)), [mutate]);
  const { update, requestDelete, deleteDialog } = useActionItemMutations({ onUpdated, onDeleted });

  const groups = useMemo(() => {
    const filtered = (items.data ?? []).filter((item) => !mineOnly || item.assignee?.name === CURRENT_USER.name);
    const byMeeting = new Map<number, { title: string; items: ActionItemWithMeeting[] }>();
    for (const item of filtered) {
      const group = byMeeting.get(item.meeting_id) ?? { title: item.meeting_title, items: [] };
      group.items.push(item);
      byMeeting.set(item.meeting_id, group);
    }
    return [...byMeeting.entries()];
  }, [items.data, mineOnly]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Action items" description="Every follow-up captured across your meetings." />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-surface-2 p-1" role="tablist">
          {(["open", "completed", "all"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={status === value}
              onClick={() => setStatus(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                status === value ? "bg-surface text-primary-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Assigned to me
        </label>
      </div>

      {items.error && !items.data ? (
        <ErrorState message={items.error} onRetry={items.reload} />
      ) : !items.data || items.loading ? (
        <Spinner label="Loading action items..." />
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="tasks"
            title={status === "open" ? "No open action items" : "No action items"}
            description={status === "open" ? "Everything is done - nice work." : "Action items from your meetings appear here."}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([meetingId, group]) => (
            <section key={meetingId} className="card p-3">
              <Link href={`/meetings/${meetingId}`} className="mb-1 block px-2 py-1 text-sm font-semibold hover:text-primary-text">
                {group.title}
              </Link>
              {group.items.map((item) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  assigneeOptions={assigneeOptions}
                  onUpdate={update}
                  onDelete={requestDelete}
                />
              ))}
            </section>
          ))}
        </div>
      )}
      {deleteDialog}
    </div>
  );
}
