import type { Station } from "./types";

export interface StateAggregate {
  state: string;
  n_stations: number;
  n_exited: number; // RETIRED + TRANSIENT
  n_ghost: number;
  n_confirmed_gone: number;
  ghost_rate: number | null; // n_ghost / (n_ghost + n_confirmed_gone)
  avg_pct_healthy: number | null;
}

export function computeStateAggregates(stations: Station[]): Map<string, StateAggregate> {
  const byState = new Map<string, Station[]>();
  for (const s of stations) {
    if (!s.state) continue;
    const arr = byState.get(s.state);
    if (arr) arr.push(s);
    else byState.set(s.state, [s]);
  }

  const out = new Map<string, StateAggregate>();
  for (const [state, list] of byState) {
    const exited = list.filter((s) => s.cohort === "RETIRED" || s.cohort === "TRANSIENT");
    const nGhost = exited.filter((s) => s.afdc_category === "ghost").length;
    const nConfirmedGone = exited.filter((s) => s.afdc_category === "confirmed_gone").length;
    const matched = nGhost + nConfirmedGone;
    const healthVals = list.map((s) => s.pct_healthy_lifetime).filter((v): v is number => v !== null);
    out.set(state, {
      state,
      n_stations: list.length,
      n_exited: exited.length,
      n_ghost: nGhost,
      n_confirmed_gone: nConfirmedGone,
      ghost_rate: matched > 0 ? nGhost / matched : null,
      avg_pct_healthy: healthVals.length ? healthVals.reduce((a, b) => a + b, 0) / healthVals.length : null,
    });
  }
  return out;
}
