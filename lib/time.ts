// Panel spans July 2023 - June 2026, 36 months. Small helpers to convert
// between YYYYMM (as used in the exported data) and a 0-based month index
// (as used by the time-lapse slider).
export const PANEL_START_YM = 202307;
export const PANEL_MONTH_COUNT = 36;

export function ymToIndex(ym: number): number {
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  const startY = Math.floor(PANEL_START_YM / 100);
  const startM = PANEL_START_YM % 100;
  return (y - startY) * 12 + (m - startM);
}

export function indexToYm(idx: number): number {
  const startY = Math.floor(PANEL_START_YM / 100);
  const startM = PANEL_START_YM % 100;
  const totalM = startY * 12 + (startM - 1) + idx;
  const y = Math.floor(totalM / 12);
  const m = (totalM % 12) + 1;
  return y * 100 + m;
}

export function formatYm(ym: number): string {
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  return `${y}-${String(m).padStart(2, "0")}`;
}
