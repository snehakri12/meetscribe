"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { splitNames, toDateTimeLocal } from "@/lib/format";
import type { MeetingDetail } from "@/lib/types";

type EditableMeeting = {
  id: number;
  title: string;
  started_at: string;
  participants: { name: string }[];
  topics: { name: string }[];
};

type EditMeetingModalProps = {
  meeting: EditableMeeting | null;
  onClose: () => void;
  onSaved: (meeting: MeetingDetail) => void;
};

/** Edit title, date, participants and keywords. Mount with a `key` per meeting. */
export function EditMeetingModal({ meeting, onClose, onSaved }: EditMeetingModalProps) {
  const toast = useToast();
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [startedAt, setStartedAt] = useState(meeting ? toDateTimeLocal(meeting.started_at) : "");
  const [participants, setParticipants] = useState(meeting?.participants.map((p) => p.name).join(", ") ?? "");
  const [topics, setTopics] = useState(meeting?.topics.map((t) => t.name).join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meeting) return;
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateMeeting(meeting.id, {
        title: title.trim(),
        started_at: startedAt ? `${startedAt}:00` : undefined,
        participants: splitNames(participants),
        topics: splitNames(topics),
      });
      toast.success("Meeting updated");
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not update the meeting"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={meeting !== null} onClose={onClose} title="Edit meeting details">
      <form id="edit-meeting-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="edit-title" className="label">
            Title
          </label>
          <input id="edit-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
        </div>
        <div>
          <label htmlFor="edit-date" className="label">
            Date & time
          </label>
          <input
            id="edit-date"
            type="datetime-local"
            className="input"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-participants" className="label">
            Participants <span className="font-normal text-subtle">(comma-separated)</span>
          </label>
          <input
            id="edit-participants"
            className="input"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-topics" className="label">
            Keywords / tags <span className="font-normal text-subtle">(comma-separated)</span>
          </label>
          <input id="edit-topics" className="input" value={topics} onChange={(e) => setTopics(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
