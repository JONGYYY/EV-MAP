export type Cohort = "ACTIVE_THROUGHOUT" | "NEWLY_ADDED" | "RETIRED" | "TRANSIENT";
export type Speed = "L2" | "DCFC" | "MIXED" | "L1" | "no_port_data";
export type AfdcCategory = "ghost" | "confirmed_gone" | "no_match" | "afdc_active" | "afdc_inactive";

export interface Station {
  LocID: number;
  lat: number;
  long: number;
  LocName: string | null;
  state: string | null;
  speed: Speed | null;
  cohort: Cohort;
  pct_healthy_lifetime: number | null;
  afdc_category: AfdcCategory;
  retirement_risk_score: number | null;
  // phase52's early-warning signal: this station's own recent (3mo) NO_DATA
  // rate minus its own trailing (9mo) baseline. Positive = degrading faster
  // than its own history -- backtested AUC-equivalent 0.71 against stations
  // that later exited. A trajectory signal, distinct from
  // retirement_risk_score (a structural/demographic signal) -- kept as a
  // separate map layer rather than blended into one score, per the plan.
  reporting_trend_score: number | null;
  // whole-word name match against known automaker-dealership brands
  // (phase53) -- null if no match. Used for the network/brand leaderboard.
  brand: string | null;
}

export type MapMode = "ghost" | "reliability" | "risk" | "trend";

export interface BrandLeaderboardRow {
  brand: string;
  n_named: number;
  n_always_zero: number;
  pct_always_zero: number | null;
}
