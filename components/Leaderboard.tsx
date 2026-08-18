"use client";

import { useEffect, useState } from "react";
import type { BrandLeaderboardRow } from "@/lib/types";

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<BrandLeaderboardRow[] | null>(null);

  useEffect(() => {
    fetch("/data/brand_leaderboard.json")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const maxPct = rows ? Math.max(...rows.map((r) => r.pct_always_zero ?? 0), 1) : 1;

  return (
    <div className="glass-panel w-80 max-w-[90vw] rounded-lg p-4 shadow-2xl animate-panel-in">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Dealership network leaderboard</h3>
        <button
          onClick={onClose}
          aria-label="Close leaderboard"
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          ✕
        </button>
      </div>
      <p className="mb-3 text-xs text-ink-faint">
        Share of named stations that report zero utilization in every observed month —
        a structural non-reporting pattern, not necessarily broken equipment.
      </p>
      {rows === null ? (
        <div className="flex h-24 items-center justify-center text-xs text-ink-faint">loading…</div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.brand}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-ink">{r.brand}</span>
                <span className="font-mono tabular text-xs text-ink-muted">
                  {r.pct_always_zero !== null ? `${r.pct_always_zero}%` : "—"}{" "}
                  <span className="text-ink-faint">
                    ({r.n_always_zero.toLocaleString()}/{r.n_named.toLocaleString()})
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="h-full rounded-full bg-ghost"
                  style={{ width: `${((r.pct_always_zero ?? 0) / maxPct) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
