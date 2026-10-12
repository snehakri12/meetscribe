"use client";

import { useCallback } from "react";
import Link from "next/link";

import { ActionItemRow } from "@/components/action-items/ActionItemRow";
import { useShell } from "@/components/layout/AppShell";
import { AvatarStack } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { ComingSoonBadge } from "@/components/ui/ComingSoon";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/States";
import { useActionItemMutations } from "@/hooks/useActionItemMutations";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { CURRENT_USER } from "@/lib/constants";
import { dayLabel, formatDuration, formatTime } from "@/lib/format";
import type { ActionItem, ActionItemWithMeeting } from "@/lib/types";

function StatCard({ icon, label, value, hint }: { icon: IconName; label: string; value: string | number; hint: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon name={icon} size={15} className="text-primary-text" /> {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-subtle">{hint}</p>
    </div>
  );
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeDashboard() {
  const { openNewMeeting, openCapture } = useShell();
  const stats = useApi(() => api.stats(), "stats");
  const recent = useApi(() => api.listMeetings({ sort: "newest" }), "recent");
  const tasks = useApi(() => api.listActionItems("open"), "open-tasks");
  const assigneeOptions = Array.from(new Set((recent.data ?? []).flatMap((m) => m.participants.map((p) => p.name))));

  const { mutate: mutateTasks } = tasks;
  const { reload: reloadStats } = stats;
  const onUpdated = useCallback(
    (updated: ActionItem) => {
      mutateTasks((list) =>
        updated.completed
          ? list.filter((item) => item.id !== updated.id)
          : list.map((item): ActionItemWithMeeting => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      reloadStats();
    },
    [mutateTasks, reloadStats],
  );
  const onDeleted = useCallback(
    (id: number) => {
      mutateTasks((list) => list.filter((item) => item.id !== id));
      reloadStats();
    },
    [mutateTasks, reloadStats],
  );
  const { update, requestDelete, deleteDialog } = useActionItemMutations({ onUpdated, onDeleted });

  const hours = stats.data ? (stats.data.total_duration_seconds / 3600).toFixed(1) : "-";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* Greeting depends on the viewer's clock, so skip SSR comparison. */}
          <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {greeting()}, {CURRENT_USER.name}
          </h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s what happened in your meetings.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={openCapture}>
            <Icon name="bot" size={16} /> Capture live meeting
          </button>
          <button className="btn-primary" onClick={openNewMeeting}>
            <Icon name="upload" size={16} /> Upload transcript
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="meetings" label="Meetings" value={stats.data?.meetings ?? "-"} hint="In your workspace" />
        <StatCard icon="clock" label="Hours transcribed" value={hours} hint="Across all meetings" />
        <StatCard icon="tasks" label="Open action items" value={stats.data?.action_items_open ?? "-"} hint="Still to do" />
        <StatCard
          icon="check"
          label="Completed"
          value={stats.data?.action_items_completed ?? "-"}
          hint="Action items done"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent meetings</h2>
            <Link href="/meetings" className="text-xs font-medium text-primary-text hover:underline">
              View all
            </Link>
          </div>
          {recent.error && !recent.data ? (
            <div className="p-4">
              <ErrorState message={recent.error} onRetry={recent.reload} />
            </div>
          ) : !recent.data ? (
            <Spinner />
          ) : recent.data.length === 0 ? (
            <EmptyState
              title="No meetings yet"
              description="Upload a transcript to see AI notes here."
              action={
                <button className="btn-primary" onClick={openNewMeeting}>
                  Upload transcript
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.data.slice(0, 6).map((meeting) => (
                <li key={meeting.id}>
                  <Link href={`/meetings/${meeting.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2">
                    <div className="w-20 shrink-0 text-xs text-muted">
                      <p className="font-semibold text-text">{dayLabel(meeting.started_at)}</p>
                      <p>{formatTime(meeting.started_at)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{meeting.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{meeting.summary || "No summary yet"}</p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <AvatarStack names={meeting.participants.map((p) => p.name)} max={3} size="xs" />
                      <span className="text-xs text-subtle">{formatDuration(meeting.duration_seconds)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Open action items</h2>
              <Link href="/tasks" className="text-xs font-medium text-primary-text hover:underline">
                View all
              </Link>
            </div>
            <div className="p-3">
              {!tasks.data ? (
                <Spinner />
              ) : tasks.data.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-subtle">You&apos;re all caught up.</p>
              ) : (
                tasks.data.slice(0, 6).map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    assigneeOptions={assigneeOptions}
                    onUpdate={update}
                    onDelete={requestDelete}
                    meetingLink={{ href: `/meetings/${item.meeting_id}`, title: item.meeting_title }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="calendar" size={16} className="text-primary-text" /> Upcoming meetings
              </h2>
              <ComingSoonBadge />
            </div>
            <p className="text-sm text-muted">
              Connect Google Calendar or Outlook so the notetaker can join your upcoming calls automatically.
            </p>
            <Link href="/integrations" className="btn-secondary mt-4 w-full">
              Browse integrations
            </Link>
          </section>
        </div>
      </div>
      {deleteDialog}
    </div>
  );
}
