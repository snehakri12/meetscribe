"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Icon } from "@/components/ui/Icon";
import { api, errorMessage } from "@/lib/api";
import { CURRENT_USER } from "@/lib/constants";
import { splitNames, toDateTimeLocal } from "@/lib/format";
import type { MeetingDetail, TranscriptFormat } from "@/lib/types";

type Mode = "upload" | "paste" | "form";

const MODES: { id: Mode; label: string; icon: "upload" | "file" | "edit" }[] = [
  { id: "upload", label: "Upload file", icon: "upload" },
  { id: "paste", label: "Paste transcript", icon: "file" },
  { id: "form", label: "Notes only", icon: "edit" },
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = [".txt", ".vtt", ".json"];

const PASTE_PLACEHOLDER = `[00:00] Sneha: Let's review the launch checklist.
[00:18] Rahul Mehta: I'll update the deployment steps by Friday.
[00:41] Priya Nair: Can you also share the release notes with marketing?`;

function formatFromFileName(name: string): TranscriptFormat {
  const ext = name.toLowerCase().split(".").pop();
  return ext === "vtt" || ext === "json" || ext === "txt" ? ext : "auto";
}

type MeetingCreateFormProps = {
  initialMode?: Mode;
  onCreated: (meeting: MeetingDetail) => void;
  onCancel?: () => void;
};

export function MeetingCreateForm({ initialMode = "upload", onCreated, onCancel }: MeetingCreateFormProps) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [participants, setParticipants] = useState(CURRENT_USER.name);
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [format, setFormat] = useState<TranscriptFormat>("auto");
  const [fileName, setFileName] = useState<string | null>(null);
  const [generateNotes, setGenerateNotes] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function readFile(file: File) {
    setError(null);
    if (!ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError("Please choose a .txt, .vtt or .json transcript file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large (max 2 MB).");
      return;
    }
    const text = await file.text();
    setTranscript(text);
    setFileName(file.name);
    setFormat(formatFromFileName(file.name));
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void readFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please give the meeting a title.");
      return;
    }
    if (mode === "upload" && !transcript) {
      setError("Choose a transcript file to upload.");
      return;
    }
    if (mode === "paste" && !transcript.trim()) {
      setError("Paste a transcript first.");
      return;
    }

    setSubmitting(true);
    try {
      const meeting = await api.createMeeting({
        title: title.trim(),
        // Empty date means "now" in the user's local time (not the server's timezone).
        started_at: `${startedAt || toDateTimeLocal(new Date())}:00`,
        participants: splitNames(participants),
        summary: summary.trim() || undefined,
        transcript_text: mode === "form" ? "" : transcript,
        transcript_format: format,
        source: mode,
        generate_notes: generateNotes,
      });
      toast.success(`"${meeting.title}" created`);
      onCreated(meeting);
    } catch (err) {
      setError(errorMessage(err, "Could not create the meeting"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1" role="tablist" aria-label="How to add a meeting">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => {
              setMode(item.id);
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
              mode === item.id ? "bg-surface text-primary-text shadow-sm" : "text-muted hover:text-text"
            }`}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="meeting-title" className="label">
            Meeting title
          </label>
          <input
            id="meeting-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly product sync"
            maxLength={255}
          />
        </div>
        <div>
          <label htmlFor="meeting-date" className="label">
            Date & time <span className="font-normal text-subtle">(defaults to now)</span>
          </label>
          <input
            id="meeting-date"
            type="datetime-local"
            className="input"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="meeting-participants" className="label">
            Participants <span className="font-normal text-subtle">(comma-separated)</span>
          </label>
          <input
            id="meeting-participants"
            className="input"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="Sneha, Rahul Mehta"
          />
        </div>
      </div>

      {mode === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-2"
          }`}
        >
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <Icon name="upload" size={20} />
          </span>
          {fileName ? (
            <p className="text-sm font-medium">
              {fileName} <span className="text-muted">({transcript.split("\n").filter(Boolean).length} lines)</span>
            </p>
          ) : (
            <p className="text-sm font-medium">Drag & drop a transcript file here</p>
          )}
          <p className="mt-1 text-xs text-muted">Supports .txt, .vtt (WebVTT) and .json - max 2 MB</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => fileInput.current?.click()}>
            {fileName ? "Choose another file" : "Browse files"}
          </button>
          <input ref={fileInput} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onFileChange} />
        </div>
      )}

      {mode === "paste" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="meeting-transcript" className="label mb-0">
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
            id="meeting-transcript"
            className="input min-h-40 font-mono text-xs leading-5"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={PASTE_PLACEHOLDER}
          />
          <p className="mt-1.5 text-xs text-subtle">
            One line per utterance: <code>[mm:ss] Speaker: text</code>. Timestamps are optional and estimated when missing.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="meeting-summary" className="label">
          Summary <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="meeting-summary"
          className="input min-h-20"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={mode === "form" ? "What was discussed?" : "Leave empty to generate one from the transcript"}
        />
      </div>

      {mode !== "form" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
          <input
            type="checkbox"
            checked={generateNotes}
            onChange={(e) => setGenerateNotes(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Icon name="sparkles" size={15} className="text-primary-text" /> Generate AI notes
            </span>
            <span className="text-xs text-muted">Summary, keywords, outline and action items from the transcript.</span>
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create meeting"}
        </button>
      </div>
    </form>
  );
}
