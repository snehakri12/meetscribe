"use client";

import { useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { MeetingDetail, TranscriptFormat } from "@/lib/types";

function toEditableText(meeting: MeetingDetail) {
  return meeting.segments
    .map((segment) => `[${formatTimestamp(segment.start_seconds)}] ${segment.speaker.name}: ${segment.text}`)
    .join("\n");
}

type EditTranscriptModalProps = {
  meeting: MeetingDetail;
  open: boolean;
  onClose: () => void;
  onSaved: (meeting: MeetingDetail) => void;
};

/** Mount only while open so the text is re-initialised from the latest transcript. */
export function EditTranscriptModal({ meeting, open, onClose, onSaved }: EditTranscriptModalProps) {
  const toast = useToast();
  const [text, setText] = useState(() => toEditableText(meeting));
  const [format, setFormat] = useState<TranscriptFormat>("auto");
  const [regenerate, setRegenerate] = useState(meeting.segments.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const annotations = meeting.segments.filter((s) => s.is_highlighted || s.comments.length > 0).length;

  async function save() {
    if (!text.trim()) {
      setError("The transcript cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.replaceTranscript(meeting.id, text, format, regenerate);
      onSaved(updated);
      toast.success("Transcript saved");
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not save the transcript"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meeting.segments.length ? "Edit transcript" : "Add transcript"}
      description="One line per utterance: [mm:ss] Speaker: text. WebVTT and JSON are also accepted."
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save transcript"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="transcript-text" className="label mb-0">
            Transcript
          </label>
          <select
            aria-label="Transcript format"
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted"
            value={format}
            onChange={(e) => setFormat(e.target.value as TranscriptFormat)}
          >
            <option value="auto">Auto-detect format</option>
            <option value="txt">Plain text</option>
            <option value="vtt">WebVTT</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <textarea
          id="transcript-text"
          className="input min-h-80 font-mono text-xs leading-5"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="[00:00] Sneha: Welcome everyone..."
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={regenerate}
            onChange={(e) => setRegenerate(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Regenerate summary, keywords and outline from the new transcript
        </label>
        {annotations > 0 && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-muted">
            Saving replaces the transcript lines, so highlights and comments on {annotations} line
            {annotations === 1 ? "" : "s"} will be removed.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
