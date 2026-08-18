"use client";

import type { MapMode } from "@/lib/types";

const LEGENDS: Record<MapMode, { swatch: string; label: string }[]> = {
  ghost: [
    { swatch: "bg-ghost", label: "Ghost — exited our panel, still active in AFDC" },
    { swatch: "bg-confirmed-gone", label: "Confirmed gone — both agree" },
    { swatch: "bg-no-match", label: "No AFDC match nearby" },
  ],
  reliability: [
    { swatch: "bg-healthy", label: "High % healthy months" },
    { swatch: "bg-degraded", label: "Low % healthy months" },
    { swatch: "bg-no-match", label: "No data" },
  ],
  risk: [
    { swatch: "bg-healthy", label: "Low predicted exit risk" },
    { swatch: "bg-risk", label: "High predicted exit risk" },
    { swatch: "bg-no-match", label: "Not scored (exited or no demographics)" },
  ],
};

export default function Legend({ mode, count }: { mode: MapMode; count: number | null }) {
  return (
    <div className="glass-panel w-64 rounded-lg p-3 text-sm shadow-lg">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-medium text-ink">Legend</span>
        <span className="font-mono tabular text-xs text-ink-muted">
          {count !== null ? `${count.toLocaleString()} stations` : "loading…"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {LEGENDS[mode].map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.swatch}`} />
            <span className="text-ink-muted">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
