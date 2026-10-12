"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/States";
import { useApi } from "@/hooks/useApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api, errorMessage } from "@/lib/api";
import { dayLabel } from "@/lib/format";
import type { MeetingListItem } from "@/lib/types";
import { EditMeetingModal } from "./EditMeetingModal";
import { EMPTY_FILTERS, MeetingFilters } from "./MeetingFilters";
import type { LibraryFilters } from "./MeetingFilters";
import { MeetingRow } from "./MeetingRow";

type Tab = "all" | "mine";

function groupByDay(meetings: MeetingListItem[]) {
  const groups: { label: string; meetings: MeetingListItem[] }[] = [];
  for (const meeting of meetings) {
    const label = dayLabel(meeting.started_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.meetings.push(meeting);
    else groups.push({ label, meetings: [meeting] });
  }
  return groups;
}

export function MeetingLibrary() {
  const toast = useToast();
  const { openNewMeeting } = useShell();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<LibraryFilters>(() => ({
    ...EMPTY_FILTERS,
    q: searchParams.get("q") ?? "",
    participant: searchParams.get("participant") ?? "",
    topic: searchParams.get("topic") ?? "",
  }));
  const [editing, setEditing] = useState<MeetingListItem | null>(null);
  const [deleting, setDeleting] = useState<MeetingListItem | null>(null);

  const debouncedQ = useDebouncedValue(filters.q, 300);
  const query = useMemo(
    () => ({ ...filters, q: debouncedQ.trim(), mine: tab === "mine" }),
    [filters, debouncedQ, tab],
  );

  const meetings = useApi(() => api.listMeetings(query), JSON.stringify(query));
  const lookups = useApi(() => Promise.all([api.listParticipants(), api.listTopics()]), "lookups");
  const [participants, topics] = lookups.data ?? [[], []];

  const groups = useMemo(() => groupByDay(meetings.data ?? []), [meetings.data]);
  const hasFilters = Boolean(filters.q || filters.participant || filters.topic || filters.date_from || filters.date_to);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.deleteMeeting(deleting.id);
      meetings.mutate((list) => list.filter((m) => m.id !== deleting.id));
      lookups.reload();
      toast.success(`"${deleting.title}" deleted`);
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete the meeting"));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Meetings"
        description="All your recorded, uploaded and pasted conversations."
        actions={
          <button className="btn-primary" onClick={openNewMeeting}>
            <Icon name="plus" size={16} /> New meeting
          </button>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-border" role="tablist">
        {(
          [
            ["all", "All meetings"],
            ["mine", "My meetings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? "border-primary text-primary-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card mb-5 p-4">
        <MeetingFilters
          filters={filters}
          participants={participants}
          topics={topics}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onReset={() => setFilters((current) => ({ ...EMPTY_FILTERS, sort: current.sort }))}
        />
      </div>

      {meetings.error && !meetings.data ? (
        <ErrorState message={meetings.error} onRetry={meetings.reload} />
      ) : !meetings.data ? (
        <Spinner label="Loading meetings..." />
      ) : meetings.data.length === 0 ? (
        <div className="card">
          {hasFilters || tab === "mine" ? (
            <EmptyState
              icon="search"
              title="No meetings match"
              description="Try a different search term or clear the filters."
              action={
                <button className="btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No meetings yet"
              description="Upload or paste a transcript to create your first meeting."
              action={
                <button className="btn-primary" onClick={openNewMeeting}>
                  <Icon name="plus" size={16} /> New meeting
                </button>
              }
            />
          )}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${meetings.loading ? "opacity-60" : ""}`} aria-busy={meetings.loading}>
          <p className="text-xs text-muted">
            {meetings.data.length} meeting{meetings.data.length === 1 ? "" : "s"}
          </p>
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">{group.label}</h2>
              <div className="card divide-y divide-border overflow-hidden">
                {group.meetings.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onTopicClick={(topic) => setFilters((current) => ({ ...current, topic }))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EditMeetingModal
        key={editing?.id ?? "none"}
        meeting={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          meetings.reload();
          lookups.reload();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete meeting?"
        message={`"${deleting?.title ?? ""}" and its transcript, notes and action items will be permanently deleted.`}
        confirmLabel="Delete meeting"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
