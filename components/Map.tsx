"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { Station, MapMode } from "@/lib/types";
import { AFDC_CATEGORY_COLOR, healthColor, trendColor, colors } from "@/lib/theme";
import { loadStateFeatures, type StateFeature } from "@/lib/usStates";
import { computeStateAggregates, type StateAggregate } from "@/lib/stateAggregates";
import Legend from "./Legend";
import LayerToggle from "./LayerToggle";
import StationPanel from "./StationPanel";
import ExportButton from "./ExportButton";
import Leaderboard from "./Leaderboard";
import FreshnessBadge from "./FreshnessBadge";
import StateInfoCard from "./StateInfoCard";
import TimeLapseControl from "./TimeLapseControl";
import { indexToYm, PANEL_MONTH_COUNT } from "@/lib/time";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty"; // free, no API key required

const CHOROPLETH_LOW: [number, number, number] = colors.healthy;
const CHOROPLETH_HIGH: [number, number, number] = colors.ghost;

// Ghost rate turns out to be uniformly high across nearly every state
// (89.7%-100% observed, not spread across the full 0-100% theoretical
// range) -- a real, striking finding in its own right (the digest's
// headline number isn't a few outlier states, it's everywhere), but it
// means a color scale spanning the full 0-1 range would render almost
// every state as visually identical. Stretch the scale to the actual
// observed min/max instead, so the real (smaller) variation is visible.
function choroplethColor(
  ghostRate: number | null,
  domainMin: number,
  domainMax: number
): [number, number, number, number] {
  if (ghostRate === null) return [...colors.noMatch, 120];
  const span = domainMax - domainMin || 1;
  const t = Math.max(0, Math.min(1, (ghostRate - domainMin) / span));
  return [
    Math.round(CHOROPLETH_LOW[0] + (CHOROPLETH_HIGH[0] - CHOROPLETH_LOW[0]) * t),
    Math.round(CHOROPLETH_LOW[1] + (CHOROPLETH_HIGH[1] - CHOROPLETH_LOW[1]) * t),
    Math.round(CHOROPLETH_LOW[2] + (CHOROPLETH_HIGH[2] - CHOROPLETH_LOW[2]) * t),
    170,
  ];
}

function colorForStation(s: Station, mode: MapMode): [number, number, number] {
  if (mode === "ghost") return AFDC_CATEGORY_COLOR[s.afdc_category] ?? colors.noMatch;
  if (mode === "reliability") return healthColor(s.pct_healthy_lifetime);
  if (mode === "risk") {
    if (s.retirement_risk_score === null) return colors.noMatch;
    const t = Math.max(0, Math.min(1, s.retirement_risk_score / 0.6));
    return [
      Math.round(colors.healthy[0] + (colors.risk[0] - colors.healthy[0]) * t),
      Math.round(colors.healthy[1] + (colors.risk[1] - colors.healthy[1]) * t),
      Math.round(colors.healthy[2] + (colors.risk[2] - colors.healthy[2]) * t),
    ];
  }
  if (mode === "trend") return trendColor(s.reporting_trend_score);
  return colors.noMatch;
}

function timeLapseColor(s: Station, ym: number): [number, number, number] {
  // ACTIVE_THROUGHOUT stations all share first_ym = panel start (left-
  // censored -- we don't know when they truly first appeared, only that
  // they were already there) and, symmetrically, ACTIVE_THROUGHOUT/
  // NEWLY_ADDED stations all share last_ym = panel end for any station
  // still active at the panel's final month (right-censored -- still
  // active, not actually exiting). Coloring on first_ym/last_ym alone
  // would falsely paint every still-active station as "exiting" at the
  // final slider position and every long-tenured station as "new" at the
  // first. Gate on cohort membership too, since NEWLY_ADDED/TRANSIENT
  // are the only cohorts whose first_ym is a genuine appearance (excluded
  // from the start window by definition) and RETIRED/TRANSIENT are the
  // only cohorts whose last_ym is a genuine exit (excluded from the end
  // window by definition).
  const isGenuineArrival = s.cohort === "NEWLY_ADDED" || s.cohort === "TRANSIENT";
  const isGenuineExit = s.cohort === "RETIRED" || s.cohort === "TRANSIENT";
  if (isGenuineArrival && s.first_ym === ym) return colors.confirmedGone; // newly added this month
  if (isGenuineExit && s.last_ym === ym) return colors.ghost; // exiting this month
  return colors.noMatch; // continuing
}

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  const [stations, setStations] = useState<Station[] | null>(null);
  const [mode, setMode] = useState<MapMode>("ghost");
  const [selected, setSelected] = useState<Station | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // choropleth (state-level rollup view)
  const [stateFeatures, setStateFeatures] = useState<StateFeature[] | null>(null);
  const [selectedState, setSelectedState] = useState<StateAggregate | null>(null);
  const stateAggregates = useMemo(
    () => (stations ? computeStateAggregates(stations) : null),
    [stations]
  );

  // growth-vs-exit time-lapse -- independent of `mode` (color scheme),
  // since it's a filter+recolor overlay rather than one of the toggle views.
  const [timeLapseActive, setTimeLapseActive] = useState(false);
  const [timeLapseMonth, setTimeLapseMonth] = useState(PANEL_MONTH_COUNT - 1);
  const [timeLapsePlaying, setTimeLapsePlaying] = useState(false);

  useEffect(() => {
    if (mode === "choropleth" && !stateFeatures) {
      loadStateFeatures().then(setStateFeatures).catch((e) => setLoadError(String(e)));
    }
  }, [mode, stateFeatures]);

  const deepLinkHandled = useRef(false);
  // Captured synchronously on first render, before any effect runs -- the
  // URL-sync effect below fires on mount (when `selected` is still null)
  // and would otherwise strip `?station=` via replaceState before the
  // async station-data fetch even resolves, losing the deep link entirely.
  const [initialDeepLinkId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("station");
    return v ? Number(v) : null;
  });

  useEffect(() => {
    fetch("/data/stations_summary.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Station[]) => setStations(data))
      .catch((e) => setLoadError(String(e)));
  }, []);

  // deep link: ?station=<LocID> opens straight to that station's panel,
  // so the digest/a tweet/a journalist can link one specific finding
  // instead of just the homepage.
  useEffect(() => {
    if (!stations || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    if (initialDeepLinkId === null) return;
    const match = stations.find((s) => s.LocID === initialDeepLinkId);
    if (match) {
      setSelected(match);
      mapRef.current?.jumpTo({ center: [match.long, match.lat], zoom: 9 });
    }
  }, [stations]);

  // keep the URL in sync with the current selection (replaceState, not
  // push, so clicking around the map doesn't spam the browser history).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("station", String(selected.LocID));
    else url.searchParams.delete("station");
    window.history.replaceState(null, "", url.toString());
  }, [selected]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [-98.5, 39.8],
      zoom: 3.6,
      pitch: 0,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);
    mapRef.current = map;
    overlayRef.current = overlay;
    if (process.env.NODE_ENV === "development") {
      map.on("load", () => console.log("[map] style loaded OK"));
      map.on("error", (e) => console.error("[map] error event:", e.error?.message ?? e));
    }

    // MapLibre measures its container once at construction time via
    // getBoundingClientRect(). In Next.js dev mode there's a real race
    // where Tailwind's stylesheet hasn't finished applying yet when this
    // effect runs, so the container can measure as 0-height and the map
    // silently renders into a wrong-sized (sometimes fully collapsed)
    // canvas that never self-corrects. A ResizeObserver on the container
    // fixes both this startup race and ordinary window/panel resizing,
    // which wasn't handled at all otherwise.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const onClick = useCallback((info: PickingInfo<Station>) => {
    if (info.object) {
      setSelected(info.object);
      mapRef.current?.flyTo({ center: [info.object.long, info.object.lat], zoom: Math.max(mapRef.current.getZoom(), 9), duration: 600 });
    }
  }, []);

  const onStateClick = useCallback(
    (info: PickingInfo<StateFeature>) => {
      if (info.object && stateAggregates) {
        const agg = stateAggregates.get(info.object.properties.abbr);
        if (agg) setSelectedState(agg);
      }
    },
    [stateAggregates]
  );

  const layers = useMemo(() => {
    if (!stations) return [];

    if (mode === "choropleth") {
      if (!stateFeatures || !stateAggregates) return [];
      const rates = [...stateAggregates.values()]
        .map((a) => a.ghost_rate)
        .filter((r): r is number => r !== null);
      const domainMin = rates.length ? Math.min(...rates) : 0;
      const domainMax = rates.length ? Math.max(...rates) : 1;
      return [
        new GeoJsonLayer<StateFeature>({
          id: "state-choropleth",
          data: stateFeatures,
          pickable: true,
          stroked: true,
          filled: true,
          getLineColor: [10, 14, 20],
          getLineWidth: 1,
          lineWidthMinPixels: 1,
          getFillColor: (f) => {
            const abbr = (f as unknown as StateFeature).properties.abbr;
            return choroplethColor(stateAggregates.get(abbr)?.ghost_rate ?? null, domainMin, domainMax);
          },
          onClick: onStateClick,
          updateTriggers: { getFillColor: stateAggregates },
        }),
      ];
    }

    // time-lapse: filter to stations present that month, colored by
    // added/exiting/continuing regardless of the selected color mode --
    // it's answering a different question (composition over time) than
    // the mode toggles are.
    const data = timeLapseActive
      ? stations.filter((s) => {
          const ym = indexToYm(timeLapseMonth);
          return s.first_ym <= ym && s.last_ym >= ym;
        })
      : stations;

    return [
      new ScatterplotLayer<Station>({
        id: "stations",
        data,
        pickable: true,
        radiusUnits: "pixels",
        // rendered radius stays small at low zoom (avoid clutter across 46k
        // points) but the pickable hit-target is padded well above it so
        // clicking/tapping a specific dot is realistic at any zoom level.
        getRadius: 3,
        radiusMinPixels: 3,
        radiusMaxPixels: 8,
        stroked: false,
        getPosition: (d) => [d.long, d.lat],
        getFillColor: (d) =>
          timeLapseActive ? timeLapseColor(d, indexToYm(timeLapseMonth)) : colorForStation(d, mode),
        updateTriggers: { getFillColor: [mode, timeLapseActive, timeLapseMonth] },
        onClick,
        transitions: { getFillColor: 250 },
      }),
    ];
  }, [stations, mode, onClick, stateFeatures, stateAggregates, onStateClick, timeLapseActive, timeLapseMonth]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers });
  }, [layers]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface">
      {/* Inline style, not a Tailwind class: maplibre-gl.css sets
          `.maplibregl-map { position: relative }` on this same element once
          the map attaches, which can win a same-specificity cascade fight
          against a `absolute inset-0` utility class depending on stylesheet
          load order -- collapsing the container to 0 height before any
          tiles ever render. Inline styles always beat external stylesheet
          rules, so this is the one spot that needs to not be a class. */}
      <div
        ref={containerRef}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {/* z-10: MapLibre inserts its own control containers (including
          deck.gl's MapboxOverlay, added via map.addControl) directly into
          the map's DOM subtree, which can end up stacked above plain
          sibling divs with no explicit z-index -- the leaderboard panel
          was rendering visually BEHIND the station canvas without this. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute left-4 top-4 flex items-start gap-2">
          <LayerToggle mode={mode} onChange={setMode} />
          <ExportButton stations={stations} />
          <button
            onClick={() => setShowLeaderboard((v) => !v)}
            aria-pressed={showLeaderboard}
            className={`glass-panel flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium shadow-lg ${
              showLeaderboard ? "text-ink" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            Brand leaderboard
          </button>
          <button
            onClick={() => setTimeLapseActive((v) => !v)}
            aria-pressed={timeLapseActive}
            className={`glass-panel flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium shadow-lg ${
              timeLapseActive ? "text-ink" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            Time-lapse
          </button>
        </div>
        <div className="pointer-events-auto absolute bottom-4 left-4 flex items-end gap-2">
          {mode === "choropleth" && selectedState ? (
            <StateInfoCard agg={selectedState} onClose={() => setSelectedState(null)} />
          ) : (
            <Legend mode={mode} count={stations?.length ?? null} />
          )}
          {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
        </div>
        {timeLapseActive && (
          <div className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2">
            <TimeLapseControl
              monthIndex={timeLapseMonth}
              onChange={setTimeLapseMonth}
              playing={timeLapsePlaying}
              onTogglePlay={() => setTimeLapsePlaying((v) => !v)}
              onClose={() => {
                setTimeLapseActive(false);
                setTimeLapsePlaying(false);
              }}
            />
          </div>
        )}
        {/* bottom-8, not bottom-4: MapLibre's required attribution control
            occupies the same corner at the very bottom edge -- this keeps
            it clearly visible rather than crowded/covered. */}
        <div className="pointer-events-auto absolute bottom-8 right-4">
          <FreshnessBadge />
        </div>
        {loadError && (
          <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2 rounded-md border border-ghost/40 bg-surface-panel/90 px-4 py-2 text-sm text-ghost">
            Failed to load station data: {loadError}
          </div>
        )}
        {selected && (
          <div className="pointer-events-auto absolute right-0 top-0 h-full">
            <StationPanel station={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
