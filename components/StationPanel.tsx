"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/lib/types";
import { AFDC_CATEGORY_LABEL } from "@/lib/theme";
import { queryStationHistory, type HistoryMonth } from "@/lib/duckdb";
import HistoryChart from "./HistoryChart";

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
  const [history, setHistory] = useState<HistoryMonth[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    setHistoryError(null);
    queryStationHistory(station.LocID)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch((e) => {
        if (!cancelled) setHistoryError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [station.LocID]);

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
        label="Predicted exit risk (structural)"
        value={
          station.retirement_risk_score !== null
            ? `${(station.retirement_risk_score * 100).toFixed(1)}%`
            : "not scored"
        }
      />
      <Stat
        label="Reporting trend (own history)"
        value={
          station.reporting_trend_score !== null
            ? `${station.reporting_trend_score >= 0 ? "+" : ""}${(station.reporting_trend_score * 100).toFixed(1)}pp`
            : "not scored"
        }
      />

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-ink">3-year history</h3>
        {historyError ? (
          <p className="text-xs text-ghost">Failed to load history: {historyError}</p>
        ) : history === null ? (
          <div className="flex h-24 items-center justify-center gap-2 text-xs text-ink-faint">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-faint border-t-transparent" />
            loading monthly history…
          </div>
        ) : (
          <HistoryChart data={history} />
        )}
      </div>
    </div>
  );
}
