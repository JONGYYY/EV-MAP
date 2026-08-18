"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { Station, MapMode } from "@/lib/types";
import { AFDC_CATEGORY_COLOR, healthColor, trendColor, colors } from "@/lib/theme";
import Legend from "./Legend";
import LayerToggle from "./LayerToggle";
import StationPanel from "./StationPanel";
import ExportButton from "./ExportButton";
import Leaderboard from "./Leaderboard";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty"; // free, no API key required

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

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  const [stations, setStations] = useState<Station[] | null>(null);
  const [mode, setMode] = useState<MapMode>("ghost");
  const [selected, setSelected] = useState<Station | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
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

  const layers = useMemo(() => {
    if (!stations) return [];
    return [
      new ScatterplotLayer<Station>({
        id: "stations",
        data: stations,
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
        getFillColor: (d) => colorForStation(d, mode),
        updateTriggers: { getFillColor: mode },
        onClick,
        transitions: { getFillColor: 250 },
      }),
    ];
  }, [stations, mode, onClick]);

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
        </div>
        <div className="pointer-events-auto absolute bottom-4 left-4 flex items-end gap-2">
          <Legend mode={mode} count={stations?.length ?? null} />
          {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
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
