"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatTimestamp } from "@/lib/format";
import type { ActionItem } from "@/lib/types";

export type ActionItemChanges = { title?: string; completed?: boolean; assignee_name?: string };

type ActionItemRowProps = {
  item: ActionItem;
  assigneeOptions: string[];
  onUpdate: (item: ActionItem, changes: ActionItemChanges) => Promise<boolean>;
  onDelete: (item: ActionItem) => void;
  onSeek?: (seconds: number) => void;
  meetingLink?: { href: string; title: string };
};

export function ActionItemRow({ item, assigneeOptions, onUpdate, onDelete, onSeek, meetingLink }: ActionItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [assignee, setAssignee] = useState(item.assignee?.name ?? "");
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setTitle(item.title);
    setAssignee(item.assignee?.name ?? "");
    setEditing(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const ok = await onUpdate(item, { title: title.trim(), assignee_name: assignee });
    setSaving(false);
    if (ok) setEditing(false);
  }

  const options = Array.from(new Set([...assigneeOptions, ...(item.assignee ? [item.assignee.name] : [])]));

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-2 rounded-lg border border-primary/40 bg-surface p-3">
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Action item title"
          maxLength={500}
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            aria-label="Assignee"
          >
            <option value="">Unassigned</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={saving || !title.trim()}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => void onUpdate(item, { completed: !item.completed })}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primary)]"
        aria-label={item.completed ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-5 ${item.completed ? "text-subtle line-through" : ""}`}>{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {item.assignee ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={item.assignee.name} size="xs" className="ring-0" /> {item.assignee.name}
            </span>
          ) : (
            <span className="text-subtle">Unassigned</span>
          )}
          {item.source_start_seconds !== null && onSeek && (
            <button
              type="button"
              onClick={() => onSeek(item.source_start_seconds ?? 0)}
              className="font-mono text-primary-text hover:underline"
              title="Jump to this moment"
            >
              {formatTimestamp(item.source_start_seconds)}
            </button>
          )}
          {meetingLink && (
            <Link href={meetingLink.href} className="truncate hover:text-primary-text hover:underline">
              {meetingLink.title}
            </Link>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={startEditing}
          className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-text"
          aria-label={`Edit "${item.title}"`}
        >
          <Icon name="edit" size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
          aria-label={`Delete "${item.title}"`}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
