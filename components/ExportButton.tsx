"use client";

import type { Station } from "@/lib/types";

function toCSV(stations: Station[]): string {
  const cols: (keyof Station)[] = [
    "LocID", "LocName", "state", "lat", "long", "speed", "cohort",
    "pct_healthy_lifetime", "afdc_category", "retirement_risk_score", "reporting_trend_score",
  ];
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const rows = stations.map((s) => cols.map((c) => escape(s[c])).join(","));
  return [header, ...rows].join("\n");
}

export default function ExportButton({ stations }: { stations: Station[] | null }) {
  function download() {
    if (!stations) return;
    const csv = toCSV(stations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ev-station-data-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={!stations}
      title="Download the full station dataset as CSV"
      className="glass-panel flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-muted shadow-lg hover:bg-surface-raised hover:text-ink disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Export CSV
    </button>
  );
}
