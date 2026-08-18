import type { Cohort, Speed, AfdcCategory, Station } from "./types";

// A single filter model that applies regardless of the current color mode
// (ghost/reliability/risk/trend/choropleth) -- rather than making each
// mode's Legend swatches individually checkable, which is awkward for the
// continuous-score modes (reliability/risk/trend are gradients, not
// discrete categories).
export type SpeedGroup = "L2" | "DCFC" | "MIXED" | "OTHER";

export function speedGroupOf(speed: Speed | null): SpeedGroup {
  if (speed === "L2" || speed === "DCFC" || speed === "MIXED") return speed;
  return "OTHER"; // L1, no_port_data, or null
}

export const ALL_COHORTS: Cohort[] = ["ACTIVE_THROUGHOUT", "NEWLY_ADDED", "RETIRED", "TRANSIENT"];
export const ALL_SPEED_GROUPS: SpeedGroup[] = ["L2", "DCFC", "MIXED", "OTHER"];
export const ALL_AFDC: AfdcCategory[] = ["ghost", "confirmed_gone", "no_match", "afdc_active", "afdc_inactive"];

export interface StationFilters {
  cohort: Set<Cohort>;
  speedGroup: Set<SpeedGroup>;
  afdc: Set<AfdcCategory>;
}

export function defaultFilters(): StationFilters {
  return {
    cohort: new Set(ALL_COHORTS),
    speedGroup: new Set(ALL_SPEED_GROUPS),
    afdc: new Set(ALL_AFDC),
  };
}

export function isDefaultFilters(f: StationFilters): boolean {
  return (
    f.cohort.size === ALL_COHORTS.length &&
    f.speedGroup.size === ALL_SPEED_GROUPS.length &&
    f.afdc.size === ALL_AFDC.length
  );
}

export function applyFilters(stations: Station[], filters: StationFilters): Station[] {
  if (isDefaultFilters(filters)) return stations; // skip the pass over 46k rows when nothing's excluded
  return stations.filter(
    (s) =>
      filters.cohort.has(s.cohort) &&
      filters.speedGroup.has(speedGroupOf(s.speed)) &&
      filters.afdc.has(s.afdc_category)
  );
}
