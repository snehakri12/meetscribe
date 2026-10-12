"use client";

import { memo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { colorForName } from "@/lib/constants";
import { escapeRegExp, formatTimestamp, timeAgo } from "@/lib/format";
import type { TranscriptSegment } from "@/lib/types";

export function HighlightedText({
  text,
  term,
  activeOccurrence = -1,
}: {
  text: string;
  term: string;
  activeOccurrence?: number;
}) {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return (
    <>
      {parts.map((part, index) => {
        // With a capturing group, odd indexes are always the matches: 1, 3, 5... -> match 0, 1, 2...
        if (index % 2 === 0) return <span key={index}>{part}</span>;
        const occurrence = (index - 1) / 2;
        return (
          <mark key={index} className={occurrence === activeOccurrence ? "active-match" : undefined}>
            {part}
          </mark>
        );
      })}
    </>
  );
}

type TranscriptLineProps = {
  segment: TranscriptSegment;
  active: boolean;
  term: string;
  activeOccurrence: number;
  onSeek: (seconds: number) => void;
  onToggleHighlight: (segment: TranscriptSegment) => void;
  onAddComment: (segment: TranscriptSegment, body: string) => Promise<boolean>;
  onDeleteComment: (segment: TranscriptSegment, commentId: number) => void;
};

export const TranscriptLine = memo(function TranscriptLine({
  segment,
  active,
  term,
  activeOccurrence,
  onSeek,
  onToggleHighlight,
  onAddComment,
  onDeleteComment,
}: TranscriptLineProps) {
  const [commenting, setCommenting] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const color = colorForName(segment.speaker.name);

  function seekHere() {
    onSeek(segment.start_seconds);
  }

  function onTextKeyDown(event: KeyboardEvent<HTMLParagraphElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      seekHere();
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    const ok = await onAddComment(segment, draft.trim());
    setSaving(false);
    if (ok) {
      setDraft("");
      setCommenting(false);
    }
  }

  return (
    <div
      data-segment-id={segment.id}
      className={`group relative flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        active ? "bg-primary-soft" : "hover:bg-surface-2"
      } ${segment.is_highlighted ? "border-l-2 border-amber-400" : "border-l-2 border-transparent"}`}
    >
      <Avatar name={segment.speaker.name} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color }}>
            {segment.speaker.name}
          </span>
          <button
            onClick={seekHere}
            className="font-mono text-xs text-subtle hover:text-primary-text hover:underline"
            aria-label={`Play from ${formatTimestamp(segment.start_seconds)}`}
          >
            {formatTimestamp(segment.start_seconds)}
          </button>
          {segment.is_highlighted && (
            <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
              Highlight
            </span>
          )}
          <div className="ml-auto flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              onClick={() => onToggleHighlight(segment)}
              className={`rounded-md p-1 hover:bg-surface-3 ${segment.is_highlighted ? "text-amber-500" : "text-muted"}`}
              aria-label={segment.is_highlighted ? "Remove highlight" : "Highlight this moment"}
              aria-pressed={segment.is_highlighted}
              title={segment.is_highlighted ? "Remove highlight" : "Highlight (soundbite)"}
            >
              <Icon name="star" size={15} fill={segment.is_highlighted ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setCommenting((value) => !value)}
              className="rounded-md p-1 text-muted hover:bg-surface-3"
              aria-label="Add a comment"
              title="Comment"
            >
              <Icon name="comment" size={15} />
            </button>
          </div>
        </div>

        <p
          role="button"
          tabIndex={0}
          onClick={seekHere}
          onKeyDown={onTextKeyDown}
          className="mt-0.5 cursor-pointer text-[15px] leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          title="Click to play from here"
        >
          <HighlightedText text={segment.text} term={term} activeOccurrence={activeOccurrence} />
        </p>

        {segment.comments.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {segment.comments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <Avatar name={comment.author} size="xs" className="mt-0.5 ring-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold">{comment.author}</span>{" "}
                  <span className="text-xs text-subtle">{timeAgo(comment.created_at)}</span>
                  <p className="text-sm text-muted">{comment.body}</p>
                </div>
                <button
                  onClick={() => onDeleteComment(segment, comment.id)}
                  className="rounded p-0.5 text-subtle hover:text-danger"
                  aria-label="Delete comment"
                >
                  <Icon name="x" size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {commenting && (
          <form onSubmit={submitComment} className="mt-2 flex gap-2">
            <input
              className="input h-8 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment..."
              aria-label="Comment"
              maxLength={2000}
              autoFocus
            />
            <button type="submit" className="btn-primary h-8 px-3 text-xs" disabled={saving || !draft.trim()}>
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
});
