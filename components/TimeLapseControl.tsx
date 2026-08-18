"use client";

import { useEffect, useRef } from "react";
import { formatYm, indexToYm, PANEL_MONTH_COUNT } from "@/lib/time";

export default function TimeLapseControl({
  monthIndex,
  onChange,
  playing,
  onTogglePlay,
  onClose,
}: {
  monthIndex: number;
  onChange: (idx: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      onChange((prev => (prev + 1) % PANEL_MONTH_COUNT)(monthIndex));
    }, 450);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, monthIndex]);

  return (
    <div className="glass-panel flex w-[32rem] max-w-[90vw] items-center gap-3 rounded-lg px-4 py-3 shadow-2xl animate-panel-in">
      <button
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink hover:bg-surface-border"
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z" /></svg>
        )}
      </button>

      <div className="flex-1">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-medium text-ink-muted">growth vs. exit, month by month</span>
          <span className="font-mono tabular text-sm text-ink">{formatYm(indexToYm(monthIndex))}</span>
        </div>
        <input
          type="range"
          min={0}
          max={PANEL_MONTH_COUNT - 1}
          value={monthIndex}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-ghost"
          aria-label="Panel month"
        />
        <div className="mt-1 flex gap-3 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-confirmed-gone" /> newly added this month</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ghost" /> exiting this month</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-no-match" /> continuing</span>
        </div>
      </div>

      <button
        onClick={onClose}
        aria-label="Close time-lapse"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
