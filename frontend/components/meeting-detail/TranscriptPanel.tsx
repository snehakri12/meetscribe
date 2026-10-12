"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { escapeRegExp } from "@/lib/format";
import type { TranscriptSegment } from "@/lib/types";
import { TranscriptLine } from "./TranscriptLine";

type TranscriptPanelProps = {
  segments: TranscriptSegment[];
  activeSegmentId: number | null;
  follow: boolean;
  onFollowChange: (follow: boolean) => void;
  onSeek: (seconds: number) => void;
  onToggleHighlight: (segment: TranscriptSegment) => void;
  onAddComment: (segment: TranscriptSegment, body: string) => Promise<boolean>;
  onDeleteComment: (segment: TranscriptSegment, commentId: number) => void;
  onEditTranscript: () => void;
};

type Match = { segmentId: number; occurrence: number };

function talkTimeBySpeaker(segments: TranscriptSegment[]) {
  const totals = new Map<string, number>();
  let all = 0;
  for (const segment of segments) {
    const length = Math.max(0, segment.end_seconds - segment.start_seconds);
    totals.set(segment.speaker.name, (totals.get(segment.speaker.name) ?? 0) + length);
    all += length;
  }
  return [...totals.entries()]
    .map(([name, seconds]) => ({ name, percent: all ? Math.round((seconds / all) * 100) : 0 }))
    .sort((a, b) => b.percent - a.percent);
}

export function TranscriptPanel({
  segments,
  activeSegmentId,
  follow,
  onFollowChange,
  onSeek,
  onToggleHighlight,
  onAddComment,
  onDeleteComment,
  onEditTranscript,
}: TranscriptPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState({ term: "", index: 0 });
  const [hiddenSpeakers, setHiddenSpeakers] = useState<Set<string>>(new Set());
  const [highlightsOnly, setHighlightsOnly] = useState(false);

  const term = query.trim();
  const speakers = useMemo(() => talkTimeBySpeaker(segments), [segments]);
  const visible = useMemo(
    () =>
      segments.filter(
        (segment) => !hiddenSpeakers.has(segment.speaker.name) && (!highlightsOnly || segment.is_highlighted),
      ),
    [segments, hiddenSpeakers, highlightsOnly],
  );

  const matches = useMemo<Match[]>(() => {
    if (!term) return [];
    const regex = new RegExp(escapeRegExp(term), "gi");
    const found: Match[] = [];
    for (const segment of visible) {
      const count = segment.text.match(regex)?.length ?? 0;
      for (let occurrence = 0; occurrence < count; occurrence += 1) found.push({ segmentId: segment.id, occurrence });
    }
    return found;
  }, [visible, term]);

  const matchIndex = cursor.term === term && cursor.index < matches.length ? cursor.index : 0;
  const currentMatch = matches[matchIndex];

  // Scroll the current search match into view.
  useEffect(() => {
    if (!currentMatch) return;
    listRef.current
      ?.querySelector(`[data-segment-id="${currentMatch.segmentId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentMatch]);

  // Follow along: keep the line being played visible. Only scroll when the active
  // line changes (or follow is re-enabled), so the page doesn't jump on load.
  const lastFollowed = useRef<{ id: number | null; follow: boolean }>({ id: segments[0]?.id ?? null, follow });
  useEffect(() => {
    const previous = lastFollowed.current;
    lastFollowed.current = { id: activeSegmentId, follow };
    const changed = previous.id !== activeSegmentId || (follow && !previous.follow);
    if (!changed || !follow || activeSegmentId === null || term) return;
    listRef.current
      ?.querySelector(`[data-segment-id="${activeSegmentId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSegmentId, follow, term]);

  function goToMatch(delta: number) {
    if (!matches.length) return;
    onFollowChange(false);
    setCursor({ term, index: (matchIndex + delta + matches.length) % matches.length });
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      goToMatch(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  function toggleSpeaker(name: string) {
    setHiddenSpeakers((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (segments.length === 0) {
    return (
      <EmptyState
        icon="file"
        title="No transcript yet"
        description="Add a transcript to get speaker labels, timestamps, search and AI notes."
        action={
          <button className="btn-primary" onClick={onEditTranscript}>
            <Icon name="plus" size={15} /> Add transcript
          </button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="sticky top-14 z-10 space-y-3 border-b border-border bg-surface px-4 py-3 lg:top-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search transcript"
              aria-label="Search within transcript"
              className="input h-9 pl-8 pr-24"
            />
            {term && (
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                <span className="px-1 text-xs tabular-nums text-muted" aria-live="polite">
                  {matches.length ? `${matchIndex + 1}/${matches.length}` : "0/0"}
                </span>
                <button
                  onClick={() => goToMatch(-1)}
                  className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-40"
                  disabled={!matches.length}
                  aria-label="Previous match"
                >
                  <Icon name="chevronUp" size={14} />
                </button>
                <button
                  onClick={() => goToMatch(1)}
                  className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-40"
                  disabled={!matches.length}
                  aria-label="Next match"
                >
                  <Icon name="chevronDown" size={14} />
                </button>
              </div>
            )}
          </div>
          <button className="btn-secondary h-9 px-3" onClick={onEditTranscript} title="Edit transcript">
            <Icon name="edit" size={15} /> <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {speakers.map((speaker) => {
            const hidden = hiddenSpeakers.has(speaker.name);
            return (
              <button
                key={speaker.name}
                onClick={() => toggleSpeaker(speaker.name)}
                aria-pressed={!hidden}
                className={`chip gap-1.5 py-0.5 pl-0.5 transition ${hidden ? "opacity-45" : "hover:border-primary"}`}
                title={hidden ? `Show ${speaker.name}` : `Hide ${speaker.name}`}
              >
                <Avatar name={speaker.name} size="xs" className="ring-0" />
                {speaker.name}
                <span className="text-subtle">{speaker.percent}%</span>
              </button>
            );
          })}
          <button
            onClick={() => setHighlightsOnly((value) => !value)}
            aria-pressed={highlightsOnly}
            className={`chip py-0.5 ${highlightsOnly ? "border-amber-400 text-amber-600 dark:text-amber-300" : ""}`}
          >
            <Icon name="star" size={12} fill={highlightsOnly ? "currentColor" : "none"} /> Highlights
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        onWheel={() => follow && onFollowChange(false)}
        onTouchMove={() => follow && onFollowChange(false)}
        className="space-y-0.5 px-2 py-3"
      >
        {visible.map((segment) => (
          <TranscriptLine
            key={segment.id}
            segment={segment}
            active={segment.id === activeSegmentId}
            term={term}
            activeOccurrence={currentMatch?.segmentId === segment.id ? currentMatch.occurrence : -1}
            onSeek={onSeek}
            onToggleHighlight={onToggleHighlight}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        ))}
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-subtle">No lines match the selected speakers or highlights.</p>
        )}
        {term && matches.length === 0 && (
          <p className="py-2 text-center text-xs text-subtle">No matches for &quot;{term}&quot;.</p>
        )}
      </div>

      {!follow && (
        <button
          onClick={() => onFollowChange(true)}
          className="btn-primary sticky bottom-24 mx-auto lg:bottom-3 mb-3 rounded-full px-4 py-1.5 text-xs shadow-card"
        >
          <Icon name="chevronDown" size={14} /> Follow along
        </button>
      )}
    </div>
  );
}
