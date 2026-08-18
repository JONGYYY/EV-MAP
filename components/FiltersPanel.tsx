"use client";

import { useState } from "react";
import type { Cohort, AfdcCategory } from "@/lib/types";
import { AFDC_CATEGORY_LABEL } from "@/lib/theme";
import {
  ALL_COHORTS,
  ALL_SPEED_GROUPS,
  ALL_AFDC,
  defaultFilters,
  isDefaultFilters,
  type StationFilters,
  type SpeedGroup,
} from "@/lib/filters";

const COHORT_LABEL: Record<Cohort, string> = {
  ACTIVE_THROUGHOUT: "Active since day one",
  NEWLY_ADDED: "Newly added",
  RETIRED: "Retired (exited)",
  TRANSIENT: "Transient (exited, short tenure)",
};

const SPEED_LABEL: Record<SpeedGroup, string> = {
  L2: "L2",
  DCFC: "DC fast charging",
  MIXED: "Mixed L2 + DCFC",
  OTHER: "L1 / unknown port type",
};

const AFDC_SHORT_LABEL: Record<AfdcCategory, string> = {
  ghost: "Ghost",
  confirmed_gone: "Confirmed gone",
  no_match: "No AFDC match",
  afdc_active: "AFDC active",
  afdc_inactive: "AFDC inactive",
};

function CheckboxGroup<T extends string>({
  title,
  all,
  labels,
  selected,
  onChange,
}: {
  title: string;
  all: T[];
  labels: Record<T, string>;
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
}) {
  function toggle(v: T) {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  }
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</span>
        <div className="flex gap-2 text-[11px]">
          <button onClick={() => onChange(new Set(all))} className="text-ink-faint hover:text-ink-muted">
            All
          </button>
          <button onClick={() => onChange(new Set())} className="text-ink-faint hover:text-ink-muted">
            None
          </button>
        </div>
      </div>
      <ul className="space-y-1">
        {all.map((v) => (
          <li key={v}>
            <label className="flex min-h-[28px] cursor-pointer items-center gap-2 text-sm text-ink-muted hover:text-ink">
              <input
                type="checkbox"
                checked={selected.has(v)}
                onChange={() => toggle(v)}
                className="h-4 w-4 shrink-0 rounded border-surface-border bg-surface-raised accent-ghost"
              />
              {labels[v]}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FiltersPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: StationFilters;
  onChange: (next: StationFilters) => void;
  onClose: () => void;
}) {
  return (
    <div className="glass-panel w-72 max-w-[90vw] rounded-lg p-4 shadow-2xl animate-panel-in">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Filters</h3>
        <div className="flex items-center gap-1">
          {!isDefaultFilters(filters) && (
            <button
              onClick={() => onChange(defaultFilters())}
              className="text-xs text-ink-faint hover:text-ink-muted"
            >
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-ink-faint">
        Applies to every view -- the points on the map, state aggregates, and the CSV export.
      </p>

      <CheckboxGroup
        title="Lifecycle"
        all={ALL_COHORTS}
        labels={COHORT_LABEL}
        selected={filters.cohort}
        onChange={(cohort) => onChange({ ...filters, cohort })}
      />
      <CheckboxGroup
        title="Charger type"
        all={ALL_SPEED_GROUPS}
        labels={SPEED_LABEL}
        selected={filters.speedGroup}
        onChange={(speedGroup) => onChange({ ...filters, speedGroup })}
      />
      <CheckboxGroup
        title="AFDC status"
        all={ALL_AFDC}
        labels={AFDC_SHORT_LABEL}
        selected={filters.afdc}
        onChange={(afdc) => onChange({ ...filters, afdc })}
      />
    </div>
  );
}
