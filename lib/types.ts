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
}

export type MapMode = "ghost" | "reliability" | "risk";
