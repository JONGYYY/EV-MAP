"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/lib/types";
import { AFDC_CATEGORY_LABEL } from "@/lib/theme";
import { formatYm } from "@/lib/time";
import { queryStationHistory, type HistoryMonth } from "@/lib/duckdb";
import HistoryChart from "./HistoryChart";
import InfoTooltip from "./InfoTooltip";

const COHORT_LABEL: Record<string, string> = {
  ACTIVE_THROUGHOUT: "Active since day one",
  NEWLY_ADDED: "Newly added",
  RETIRED: "Retired (exited)",
  TRANSIENT: "Transient (exited, short tenure)",
};

function Stat({
  label,
  value,
  tooltip,
  tooltipAlign = "start",
}: {
  label: string;
  value: string;
  tooltip?: string;
  tooltipAlign?: "start" | "end";
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-surface-border/60 py-2">
      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
        {label}
        {tooltip && <InfoTooltip text={tooltip} align={tooltipAlign} />}
      </span>
      <span className="font-mono tabular text-sm text-ink">{value}</span>
    </div>
  );
}

export default function StationPanel({ station, onClose }: { station: Station; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryMonth[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("station", String(station.LocID));
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

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
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={copyLink}
            aria-label="Copy a link directly to this station"
            title="Copy link to this station"
            className="flex h-11 min-w-[44px] items-center justify-center rounded-md px-2 text-xs font-medium text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <button
            onClick={onClose}
            aria-label="Close station details"
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-1.5 rounded-md border border-ghost/30 bg-ghost/10 px-3 py-2 text-xs text-ink">
        <span>{AFDC_CATEGORY_LABEL[station.afdc_category] ?? station.afdc_category}</span>
        <InfoTooltip
          align="end"
          text="How we compare our own panel to NREL/NLR's AFDC national locator: 'ghost' means this station stopped reporting to us but AFDC still lists it as active; 'confirmed gone' means both agree it's inactive; matching is by GPS proximity (within ~550m), not by name."
        />
      </div>

      {station.afdc_name && (
        <div className="mb-4 rounded-md border border-surface-border bg-surface-raised/50 px-3 py-2 text-xs">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-ink-muted">
            Matched AFDC record
            <InfoTooltip text="The specific AFDC listing this station was paired to, found by nearest GPS coordinates within ~550m. Names often differ (AFDC and our panel don't share IDs) -- this is the actual record behind the category above." />
          </div>
          <div className="text-ink">{station.afdc_name}</div>
          {station.afdc_date_confirmed && (
            <div className="mt-0.5 text-ink-faint">AFDC last confirmed {station.afdc_date_confirmed}</div>
          )}
        </div>
      )}

      <Stat
        label="Lifecycle status"
        value={COHORT_LABEL[station.cohort] ?? station.cohort}
        tooltip="Based on when this station appears in our panel (July 2023 - June 2026): 'active since day one' was present at the very start; 'newly added' wasn't there at the start but is now; 'retired' was present at the start and disappeared for 12+ months; 'transient' appeared and/or disappeared mid-panel with under 12 months of tenure."
      />
      <Stat label="Charger type" value={station.speed ?? "unknown"} />
      {station.brand && <Stat label="Brand / network" value={station.brand} />}
      <Stat label="Total ports" value={station.total_ports !== null ? station.total_ports.toString() : "—"} />
      <Stat label="First seen" value={formatYm(station.first_ym)} />
      <Stat label="Last seen" value={formatYm(station.last_ym)} />
      <Stat
        label="Lifetime % healthy"
        value={station.pct_healthy_lifetime !== null ? `${station.pct_healthy_lifetime.toFixed(1)}%` : "—"}
        tooltip="Share of this station's observed months with zero outage events, counting only months where reporting was reliable enough to trust (NO_DATA months are excluded, not counted as healthy)."
      />
      <Stat
        label="Predicted exit risk (structural)"
        value={
          station.retirement_risk_score !== null
            ? `${(station.retirement_risk_score * 100).toFixed(1)}%`
            : "not scored"
        }
        tooltip="Modeled probability of exiting the panel, based on this area's income, density, education, and this station's port type/size, fit against stations with similar characteristics. A statistical pattern across similar stations, not a certainty for this one specifically."
        tooltipAlign="end"
      />
      <Stat
        label="Reporting trend (own history)"
        value={
          station.reporting_trend_score !== null
            ? `${station.reporting_trend_score >= 0 ? "+" : ""}${(station.reporting_trend_score * 100).toFixed(1)}pp`
            : "not scored"
        }
        tooltip="This station's own recent (last 3mo) rate of unreliable/missing reporting, minus its own trailing year-long baseline rate. Positive means it's degrading faster than its own history -- exited stations averaged around +18pp on this signal shortly before exiting, vs. about +1pp for stations that stayed active."
        tooltipAlign="end"
      />
      {station.zcta_median_income !== null && (
        <Stat
          label="Local median income (ZCTA)"
          value={`$${Math.round(station.zcta_median_income).toLocaleString()}`}
          tooltip="Median household income of the ZIP code area this station sits in (Census ZCTA), not specific to this station or its owner -- used as a demographic covariate in the exit-risk model above."
        />
      )}

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
