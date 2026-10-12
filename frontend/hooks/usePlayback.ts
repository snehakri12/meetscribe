"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

/**
 * Simulated media clock for the meeting player.
 *
 * Real recordings are out of scope, so playback is a timer that advances
 * `currentTime` from 0 to `duration` at the selected speed. Everything that
 * depends on the recording position (seek bar, active transcript line,
 * click-to-seek) works exactly as it would with an <audio> element.
 */
export function usePlayback(duration: number, initialTime = 0) {
  const [currentTime, setCurrentTime] = useState(() => Math.max(0, Math.min(duration, initialTime)));
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    lastTick.current = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = ((now - (lastTick.current ?? now)) / 1000) * rate;
      lastTick.current = now;
      setCurrentTime((time) => {
        const next = Math.min(duration, time + elapsed);
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 200);
    return () => window.clearInterval(interval);
  }, [playing, rate, duration]);

  const seek = useCallback(
    (seconds: number, autoplay = false) => {
      setCurrentTime(Math.max(0, Math.min(duration, seconds)));
      if (autoplay && duration > 0) setPlaying(true);
    },
    [duration],
  );

  const toggle = useCallback(() => {
    if (duration <= 0) return;
    setPlaying((value) => {
      if (!value) {
        // Restart from the beginning if playback had reached the end.
        setCurrentTime((time) => (time >= duration ? 0 : time));
      }
      return !value;
    });
  }, [duration]);

  const skip = useCallback(
    (delta: number) => setCurrentTime((time) => Math.max(0, Math.min(duration, time + delta))),
    [duration],
  );

  return { currentTime, playing, rate, setRate, seek, toggle, skip, pause: () => setPlaying(false) };
}

export type Playback = ReturnType<typeof usePlayback>;
