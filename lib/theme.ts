// Design tokens mirrored from tailwind.config.ts, as plain values for use in
// deck.gl layer definitions (which need RGBA arrays, not CSS classes).

export const colors = {
  ghost: [255, 107, 94] as [number, number, number],
  confirmedGone: [45, 212, 167] as [number, number, number],
  noMatch: [90, 100, 114] as [number, number, number],
  healthy: [79, 184, 232] as [number, number, number],
  degraded: [240, 166, 60] as [number, number, number],
  risk: [199, 107, 240] as [number, number, number],
};

export const AFDC_CATEGORY_COLOR: Record<string, [number, number, number]> = {
  ghost: colors.ghost,
  confirmed_gone: colors.confirmedGone,
  no_match: colors.noMatch,
  afdc_active: colors.healthy,
  afdc_inactive: colors.degraded,
};

export const AFDC_CATEGORY_LABEL: Record<string, string> = {
  ghost: "Ghost station — exited our panel, still active in AFDC",
  confirmed_gone: "Confirmed gone — exited our panel, AFDC agrees it's inactive",
  no_match: "No AFDC match found nearby",
  afdc_active: "Active — matches AFDC's active listing",
  afdc_inactive: "Active in our panel, but AFDC lists it inactive",
};

export function healthColor(pctHealthy: number | null): [number, number, number] {
  if (pctHealthy === null) return colors.noMatch;
  // interpolate degraded -> healthy across 0-100
  const t = Math.max(0, Math.min(1, pctHealthy / 100));
  const a = colors.degraded;
  const b = colors.healthy;
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}
