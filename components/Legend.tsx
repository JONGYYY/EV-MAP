"use client";

import type { MapMode } from "@/lib/types";
import InfoTooltip from "./InfoTooltip";

const MODE_TOOLTIP: Record<MapMode, string> = {
  ghost:
    "Compares our panel to NREL/NLR's AFDC national locator for stations that exited our feed: still AFDC-active (a 'ghost'), confirmed inactive by both, or no nearby AFDC record at all. Matching is by GPS proximity (~550m), not name.",
  reliability:
    "Share of each station's observed months with zero outage events, excluding months where reporting itself was too unreliable to trust.",
  risk:
    "Modeled probability of exiting the panel, from a regression on local income/density/education and the station's own port type/size -- a statistical pattern across similar stations, not a certainty for any one station.",
  trend:
    "Each station's own recent (3mo) unreliable-reporting rate vs. its own trailing year-long baseline. Positive/red means degrading faster than its own history -- a trajectory signal, distinct from the structural risk score.",
  equity:
    "Median household income of the ZIP code (Census ZCTA) each station sits in -- a property of the surrounding area, not of the station or its owner specifically.",
  choropleth:
    "State-level share of exited stations (matched to AFDC) that AFDC still lists as active -- the same 'ghost' concept as the ghost mode, aggregated to state.",
};

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
  trend: [
    { swatch: "bg-healthy", label: "Reporting steady vs. own history" },
    { swatch: "bg-ghost", label: "Reporting degrading vs. own history" },
    { swatch: "bg-no-match", label: "Not scored (exited or under 6mo history)" },
  ],
  equity: [
    { swatch: "bg-equity-low", label: "Lower local median income" },
    { swatch: "bg-equity-high", label: "Higher local median income" },
    { swatch: "bg-no-match", label: "No income data for this area" },
  ],
  choropleth: [
    { swatch: "bg-healthy", label: "Low ghost rate (state-level)" },
    { swatch: "bg-ghost", label: "High ghost rate (state-level)" },
    { swatch: "bg-no-match", label: "No exited stations matched to AFDC" },
  ],
};

export default function Legend({ mode, count }: { mode: MapMode; count: number | null }) {
  return (
    <div className="glass-panel w-64 rounded-lg p-3 text-sm shadow-lg">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 font-medium text-ink">
          Legend
          <InfoTooltip text={MODE_TOOLTIP[mode]} />
        </span>
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
