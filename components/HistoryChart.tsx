"use client";

import { useMemo, useState } from "react";
import type { HistoryMonth } from "@/lib/duckdb";

const STATUS_COLOR: Record<string, string> = {
  ZERO_EVENT: "#4fb8e8", // healthy
  HAS_EVENTS: "#f0a63c", // active with outages
  NO_DATA: "#5a6472", // unreliable reporting
};
const STATUS_LABEL: Record<string, string> = {
  ZERO_EVENT: "Healthy (no outage events)",
  HAS_EVENTS: "Active, with outage events",
  NO_DATA: "Unreliable / missing status",
};

const WIDTH = 320;
const HEIGHT = 64;
const PAD = 4;

export default function HistoryChart({ data }: { data: HistoryMonth[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { path, points, maxVal } = useMemo(() => {
    const vals = data.map((d) => d.avg_ports_in_use ?? 0);
    const max = Math.max(0.5, ...vals); // floor so a fully-flat-zero series isn't a flat line at the very bottom edge
    const n = Math.max(1, data.length - 1);
    const pts = data.map((d, i) => {
      const x = PAD + (i / n) * (WIDTH - 2 * PAD);
      const v = d.avg_ports_in_use ?? 0;
      const y = HEIGHT - PAD - (v / max) * (HEIGHT - 2 * PAD);
      return { x, y, d, i };
    });
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return { path: d, points: pts, maxVal: max };
  }, [data]);

  if (data.length === 0) {
    return <p className="text-xs text-ink-faint">No monthly history available for this station.</p>;
  }

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-muted">avg. ports in use / month</span>
        <span className="font-mono tabular text-xs text-ink-faint">max {maxVal.toFixed(1)}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Monthly average ports in use over the panel history"
      >
        <path d={path} fill="none" stroke="#4fb8e8" strokeWidth={1.5} />
        {points.map((p) => (
          <circle
            key={p.i}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === p.i ? 3 : 0}
            fill="#4fb8e8"
            className="transition-all"
          />
        ))}
        {/* transparent hit targets, wider than the visual points so hover/tap works at this density */}
        {points.map((p) => (
          <rect
            key={`hit-${p.i}`}
            x={p.x - WIDTH / data.length / 2}
            y={0}
            width={WIDTH / data.length}
            height={HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(p.i)}
            onMouseLeave={() => setHoverIdx((v) => (v === p.i ? null : v))}
          />
        ))}
      </svg>

      <div className="mt-2 mb-1 text-xs font-medium text-ink-muted">reporting status / month</div>
      <div className="flex h-3 w-full overflow-hidden rounded-sm" role="img" aria-label="Monthly reporting-status strip">
        {data.map((d, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{ backgroundColor: d.bucket_top ? STATUS_COLOR[d.bucket_top] : "#242c38" }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx((v) => (v === i ? null : v))}
          />
        ))}
      </div>

      <div className="mt-2 h-8 font-mono tabular text-xs text-ink-muted">
        {hovered ? (
          <>
            {hovered.year}-{String(hovered.month).padStart(2, "0")} ·{" "}
            {hovered.avg_ports_in_use?.toFixed(2) ?? "—"} ports ·{" "}
            <span style={{ color: hovered.bucket_top ? STATUS_COLOR[hovered.bucket_top] : undefined }}>
              {hovered.bucket_top ? STATUS_LABEL[hovered.bucket_top] : "no status"}
            </span>
          </>
        ) : (
          <span className="text-ink-faint">hover the chart for a specific month</span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-faint">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: STATUS_COLOR[key] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
