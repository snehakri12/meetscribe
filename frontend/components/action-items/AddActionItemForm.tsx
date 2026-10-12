"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Icon } from "@/components/ui/Icon";

type AddActionItemFormProps = {
  assigneeOptions: string[];
  onAdd: (title: string, assignee: string) => Promise<boolean>;
};

export function AddActionItemForm({ assigneeOptions, onAdd }: AddActionItemFormProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const ok = await onAdd(title.trim(), assignee);
    setSaving(false);
    if (ok) {
      setTitle("");
      setAssignee("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        className="input h-9 flex-1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add an action item..."
        aria-label="New action item"
        maxLength={500}
      />
      <div className="flex gap-2">
        <select
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-2 text-sm sm:w-36 sm:flex-none"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label="Assign to"
        >
          <option value="">Unassigned</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary h-9 px-3" disabled={saving || !title.trim()}>
          <Icon name="plus" size={15} /> Add
        </button>
      </div>
    </form>
  );
}
