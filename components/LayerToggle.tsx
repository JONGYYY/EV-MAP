"use client";

import type { MapMode } from "@/lib/types";

const OPTIONS: { key: MapMode; label: string }[] = [
  { key: "ghost", label: "Ghost stations" },
  { key: "reliability", label: "Reliability" },
  { key: "risk", label: "Retirement risk" },
  { key: "trend", label: "Reporting trend" },
  { key: "equity", label: "Equity (income)" },
  { key: "choropleth", label: "By state" },
];

export default function LayerToggle({
  mode,
  onChange,
}: {
  mode: MapMode;
  onChange: (m: MapMode) => void;
}) {
  return (
    <div className="glass-panel flex gap-1 rounded-lg p-1 shadow-lg">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          aria-pressed={mode === opt.key}
          className={`min-h-[44px] rounded-md px-3 text-sm font-medium transition-colors ${
            mode === opt.key
              ? "bg-ghost/15 text-ink"
              : "text-ink-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
