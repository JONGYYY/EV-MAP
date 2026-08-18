"use client";

import type { Station } from "@/lib/types";
import { AFDC_CATEGORY_LABEL } from "@/lib/theme";

const COHORT_LABEL: Record<string, string> = {
  ACTIVE_THROUGHOUT: "Active since day one",
  NEWLY_ADDED: "Newly added",
  RETIRED: "Retired (exited)",
  TRANSIENT: "Transient (exited, short tenure)",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-surface-border/60 py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-mono tabular text-sm text-ink">{value}</span>
    </div>
  );
}

export default function StationPanel({ station, onClose }: { station: Station; onClose: () => void }) {
  return (
    <div className="glass-panel h-full w-96 max-w-[90vw] overflow-y-auto p-5 shadow-2xl animate-panel-in">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold leading-tight text-ink">
            {station.LocName ?? `Station ${station.LocID}`}
          </h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            {station.state ?? "—"} · LocID {station.LocID}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close station details"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 rounded-md border border-ghost/30 bg-ghost/10 px-3 py-2 text-xs text-ink">
        {AFDC_CATEGORY_LABEL[station.afdc_category] ?? station.afdc_category}
      </div>

      <Stat label="Lifecycle status" value={COHORT_LABEL[station.cohort] ?? station.cohort} />
      <Stat label="Charger type" value={station.speed ?? "unknown"} />
      <Stat
        label="Lifetime % healthy"
        value={station.pct_healthy_lifetime !== null ? `${station.pct_healthy_lifetime.toFixed(1)}%` : "—"}
      />
      <Stat
        label="Predicted exit risk"
        value={
          station.retirement_risk_score !== null
            ? `${(station.retirement_risk_score * 100).toFixed(1)}%`
            : "not scored"
        }
      />

      {/* Full 3-year time series (utilization + reporting status) loads here
          via DuckDB-WASM querying station_history.parquet, keyed on LocID --
          follow-up build step, not wired up in this pass. */}
      <div className="mt-4 rounded-md border border-dashed border-surface-border p-3 text-center text-xs text-ink-faint">
        Full monthly history panel — coming in the next build pass.
      </div>
    </div>
  );
}
