"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { ActionItemRow } from "@/components/action-items/ActionItemRow";
import { AddActionItemForm } from "@/components/action-items/AddActionItemForm";
import { useToast } from "@/components/providers/ToastProvider";
import { ComingSoonBadge } from "@/components/ui/ComingSoon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { useActionItemMutations } from "@/hooks/useActionItemMutations";
import { api, errorMessage } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { ActionItem, MeetingDetail } from "@/lib/types";

type NotesPanelProps = {
  meeting: MeetingDetail;
  activeChapterId: number | null;
  onSeek: (seconds: number) => void;
  onReplace: (meeting: MeetingDetail) => void;
  onPatch: (updater: (meeting: MeetingDetail) => MeetingDetail) => void;
};

function Section({
  icon,
  title,
  aside,
  children,
}: {
  icon: IconName;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border px-5 py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon name={icon} size={16} className="text-primary-text" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SummarySection({ meeting, onReplace }: Pick<NotesPanelProps, "meeting" | "onReplace">) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meeting.summary);
  const [saving, setSaving] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  async function save() {
    setSaving(true);
    try {
      onReplace(await api.updateMeeting(meeting.id, { summary: draft }));
      setEditing(false);
      toast.success("Summary saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the summary"));
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    try {
      onReplace(await api.generateNotes(meeting.id));
      toast.success("AI notes regenerated from the transcript");
    } catch (error) {
      toast.error(errorMessage(error, "Could not generate notes"));
    }
  }

  return (
    <Section
      icon="sparkles"
      title="Overview"
      aside={
        !editing && (
          <div className="flex gap-1">
            {meeting.segments.length > 0 && (
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => setConfirmRegenerate(true)}
                title="Regenerate summary, keywords and outline from the transcript"
              >
                <Icon name="refresh" size={14} /> Regenerate
              </button>
            )}
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setDraft(meeting.summary);
                setEditing(true);
              }}
            >
              <Icon name="edit" size={14} /> Edit
            </button>
          </div>
        )
      }
    >
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="input min-h-36 leading-6"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Meeting summary"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : "Save summary"}
            </button>
          </div>
        </div>
      ) : meeting.summary ? (
        <p className="whitespace-pre-line text-sm leading-6 text-muted">{meeting.summary}</p>
      ) : (
        <p className="text-sm text-subtle">No summary yet. Click Edit to write one{meeting.segments.length ? " or Regenerate to create one from the transcript" : ""}.</p>
      )}
      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerate AI notes?"
        message="The summary, keywords and outline will be replaced with notes generated from the current transcript. Existing action items are kept and new ones are added."
        confirmLabel="Regenerate"
        onConfirm={regenerate}
        onClose={() => setConfirmRegenerate(false)}
      />
    </Section>
  );
}

function OutlineSection({
  meeting,
  activeChapterId,
  onSeek,
}: Pick<NotesPanelProps, "meeting" | "activeChapterId" | "onSeek">) {
  if (meeting.chapters.length === 0) return null;
  return (
    <Section icon="list" title="Outline">
      <ol className="space-y-1">
        {meeting.chapters.map((chapter) => {
          const active = chapter.id === activeChapterId;
          return (
            <li key={chapter.id}>
              <button
                onClick={() => onSeek(chapter.start_seconds)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  active ? "bg-primary-soft" : "hover:bg-surface-2"
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-primary-text">{formatTimestamp(chapter.start_seconds)}</span>
                  <span className="text-sm font-medium">{chapter.title}</span>
                </span>
                {chapter.summary && <span className="mt-0.5 block pl-12 text-xs leading-5 text-muted">{chapter.summary}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function ActionItemsSection({ meeting, onSeek, onPatch }: Pick<NotesPanelProps, "meeting" | "onSeek" | "onPatch">) {
  const toast = useToast();
  const assigneeOptions = meeting.participants.map((p) => p.name);
  const done = meeting.action_items.filter((item) => item.completed).length;

  const onUpdated = useCallback(
    (updated: ActionItem) =>
      onPatch((m) => ({ ...m, action_items: m.action_items.map((i) => (i.id === updated.id ? updated : i)) })),
    [onPatch],
  );
  const onDeleted = useCallback(
    (id: number) => onPatch((m) => ({ ...m, action_items: m.action_items.filter((i) => i.id !== id) })),
    [onPatch],
  );
  const { update, requestDelete, deleteDialog } = useActionItemMutations({ onUpdated, onDeleted });

  async function add(title: string, assignee: string) {
    try {
      const created = await api.createActionItem(meeting.id, title, assignee);
      onPatch((m) => ({ ...m, action_items: [...m.action_items, created] }));
      toast.success("Action item added");
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "Could not add the action item"));
      return false;
    }
  }

  // Group by assignee, like Fireflies' per-person action items.
  const groups = new Map<string, ActionItem[]>();
  for (const item of meeting.action_items) {
    const key = item.assignee?.name ?? "Unassigned";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <Section
      icon="tasks"
      title="Action items"
      aside={
        <span className="text-xs text-muted">
          {done}/{meeting.action_items.length} done
        </span>
      }
    >
      <div className="space-y-4">
        {[...groups.entries()].map(([owner, items]) => (
          <div key={owner}>
            <p className="mb-1 px-2 text-xs font-semibold text-subtle">{owner}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  assigneeOptions={assigneeOptions}
                  onUpdate={update}
                  onDelete={requestDelete}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </div>
        ))}
        {meeting.action_items.length === 0 && <p className="px-2 text-sm text-subtle">No action items yet.</p>}
        <AddActionItemForm assigneeOptions={assigneeOptions} onAdd={add} />
      </div>
      {deleteDialog}
    </Section>
  );
}

export function NotesPanel({ meeting, activeChapterId, onSeek, onReplace, onPatch }: NotesPanelProps) {
  const [tab, setTab] = useState<"notes" | "ask">("notes");

  return (
    <div className="flex min-h-0 flex-col">
      <div className="sticky top-14 z-10 flex gap-1 border-b border-border bg-surface px-3 lg:top-0" role="tablist">
        {(
          [
            ["notes", "AI Notes", "sparkles"],
            ["ask", "Ask AI", "comment"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium ${
              tab === id ? "border-primary text-primary-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Icon name={icon} size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "notes" ? (
        <div>
          <SummarySection key={meeting.updated_at} meeting={meeting} onReplace={onReplace} />
          {meeting.topics.length > 0 && (
            <Section icon="tag" title="Keywords">
              <div className="flex flex-wrap gap-1.5">
                {meeting.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/meetings?topic=${encodeURIComponent(topic.name)}`}
                    className="chip hover:border-primary hover:text-primary-text"
                    title={`See all meetings about ${topic.name}`}
                  >
                    #{topic.name}
                  </Link>
                ))}
              </div>
            </Section>
          )}
          <OutlineSection meeting={meeting} activeChapterId={activeChapterId} onSeek={onSeek} />
          <ActionItemsSection meeting={meeting} onSeek={onSeek} onPatch={onPatch} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start gap-3 rounded-xl bg-warning-soft p-3">
            <ComingSoonBadge />
            <p className="text-sm text-muted">
              Ask questions about this meeting (e.g. &quot;What did we decide about pricing?&quot;). LLM-powered Q&amp;A
              is not enabled in this demo.
            </p>
          </div>
          <div className="mt-auto flex gap-2">
            <input className="input" placeholder="Ask anything about this meeting..." disabled />
            <button className="btn-primary" disabled>
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
