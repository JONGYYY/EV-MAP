"use client";

import type { StateAggregate } from "@/lib/stateAggregates";

export default function StateInfoCard({ agg, onClose }: { agg: StateAggregate; onClose: () => void }) {
  return (
    <div className="glass-panel w-72 rounded-lg p-4 shadow-2xl animate-panel-in">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{agg.state}</h3>
        <button
          onClick={onClose}
          aria-label="Close state details"
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted">Stations tracked</span>
          <span className="font-mono tabular text-ink">{agg.n_stations.toLocaleString()}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted">Exited the panel</span>
          <span className="font-mono tabular text-ink">{agg.n_exited.toLocaleString()}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted">Ghost rate</span>
          <span className="font-mono tabular text-ink">
            {agg.ghost_rate !== null ? `${(agg.ghost_rate * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted">Avg. lifetime % healthy</span>
          <span className="font-mono tabular text-ink">
            {agg.avg_pct_healthy !== null ? `${agg.avg_pct_healthy.toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">
        Ghost rate = share of exited stations matched to a current AFDC record that AFDC still
        lists as active.
      </p>
    </div>
  );
}
