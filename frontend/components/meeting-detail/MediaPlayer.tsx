"use client";

import { memo, useEffect } from "react";

import { Icon } from "@/components/ui/Icon";
import { PLAYBACK_RATES } from "@/hooks/usePlayback";
import type { Playback, PlaybackRate } from "@/hooks/usePlayback";
import { colorForName } from "@/lib/constants";
import { formatTimestamp } from "@/lib/format";
import type { TranscriptSegment } from "@/lib/types";

/** Coloured blocks showing who spoke when, drawn behind the seek bar. */
const SpeakerTimeline = memo(function SpeakerTimeline({
  segments,
  duration,
}: {
  segments: TranscriptSegment[];
  duration: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface-3">
      {duration > 0 &&
        segments.map((segment) => (
          <span
            key={segment.id}
            className="absolute inset-y-0 opacity-70"
            style={{
              left: `${(segment.start_seconds / duration) * 100}%`,
              width: `${Math.max(0.3, ((segment.end_seconds - segment.start_seconds) / duration) * 100)}%`,
              backgroundColor: colorForName(segment.speaker.name),
            }}
          />
        ))}
    </div>
  );
});

function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

type MediaPlayerProps = {
  playback: Playback;
  duration: number;
  segments: TranscriptSegment[];
  activeSpeaker: string | null;
};

export function MediaPlayer({ playback, duration, segments, activeSpeaker }: MediaPlayerProps) {
  const { currentTime, playing, rate, setRate, seek, toggle, skip } = playback;
  const disabled = duration <= 0;

  // Keyboard shortcuts: Space = play/pause, Left/Right arrows = -/+15 seconds.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (disabled || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.code === "Space") {
        // Focused buttons/links already activate on Space; don't toggle twice.
        if ((event.target as HTMLElement | null)?.closest("button, a")) return;
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowLeft") {
        skip(-15);
      } else if (event.key === "ArrowRight") {
        skip(15);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, toggle, skip]);

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-3 py-2.5 backdrop-blur sm:px-5">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => skip(-15)}
            disabled={disabled}
            className="btn-ghost px-1.5"
            aria-label="Back 15 seconds"
            title="Back 15s (Left arrow)"
          >
            <Icon name="back15" size={22} />
          </button>
          <button
            onClick={toggle}
            disabled={disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
            aria-label={playing ? "Pause" : "Play"}
            title={`${playing ? "Pause" : "Play"} (Space)`}
          >
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <button
            onClick={() => skip(15)}
            disabled={disabled}
            className="btn-ghost px-1.5"
            aria-label="Forward 15 seconds"
            title="Forward 15s (Right arrow)"
          >
            <Icon name="forward15" size={22} />
          </button>
        </div>

        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
          {formatTimestamp(currentTime)}
        </span>
        <div className="relative flex-1">
          <SpeakerTimeline segments={segments} duration={duration} />
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/35"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : 0 }}
          />
          <input
            type="range"
            className="seek relative"
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={Math.min(currentTime, Math.max(duration, 1))}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={disabled}
            aria-label="Seek"
            aria-valuetext={`${formatTimestamp(currentTime)} of ${formatTimestamp(duration)}`}
          />
        </div>
        <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted">{formatTimestamp(duration)}</span>

        <select
          aria-label="Playback speed"
          value={rate}
          onChange={(event) => setRate(Number(event.target.value) as PlaybackRate)}
          className="hidden h-8 rounded-md border border-border bg-surface px-1.5 text-xs font-medium sm:block"
        >
          {PLAYBACK_RATES.map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 hidden text-center text-[11px] text-subtle sm:block">
        {activeSpeaker ? (
          <>
            Now speaking: <span className="font-medium text-muted">{activeSpeaker}</span> ·{" "}
          </>
        ) : null}
        Simulated playback - audio recording is a placeholder in this demo
      </p>
    </div>
  );
}
