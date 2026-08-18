"use client";

import { useState, useEffect, useCallback } from "react";

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  stat?: { value: string; label: string };
}

const SLIDES: Slide[] = [
  {
    eyebrow: "The problem",
    title: "The national EV charging locator shows whether a station is listed. Not whether it works.",
    body:
      "NREL/NLR's Alternative Fueling Station Locator (AFDC) is the reference dataset for public EV charging infrastructure. It keeps no history, and a station's disappearance from it doesn't distinguish confirmed physical removal from a station simply falling out of view of whatever system verifies its status.",
  },
  {
    eyebrow: "What we built",
    title: "Three years, 10-minute intervals, 46,000+ stations.",
    body:
      "A continuous, port-level operational panel of U.S. public EV charging stations, July 2023 through June 2026 — tracking not just whether a station is listed, but whether it's actually reporting, actually working, and actually there. Look for \"▶ Growth/exit timeline\" in the top toolbar to scrub through that whole history and watch stations appear and disappear month by month.",
  },
  {
    eyebrow: "What we found",
    title: "Most stations we show as \"exited\" are still listed active — somewhere else.",
    body:
      "We cross-validated our own \"exited\" stations directly against AFDC's current live listing. The result is the centerpiece of this map.",
    stat: { value: "97.7%", label: "of matched exited stations are still listed active in AFDC today" },
  },
];

const STORAGE_KEY = "ev-map-intro-seen";

export function shouldShowIntroOnLoad(): boolean {
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(STORAGE_KEY);
}

export default function IntroSequence({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  }, [onDone]);

  const next = useCallback(() => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }, [isLast, finish]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") next();
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, finish]);

  const slide = SLIDES[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface px-6">
      <button
        onClick={finish}
        className="absolute right-6 top-6 min-h-[44px] rounded-md px-3 text-sm text-ink-faint hover:bg-surface-raised hover:text-ink"
      >
        Skip to map →
      </button>

      <div className="w-full max-w-xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-ghost">{slide.eyebrow}</p>
        <h1 className="mb-4 text-2xl font-semibold leading-tight text-ink sm:text-3xl">{slide.title}</h1>
        <p className="mb-8 text-sm leading-relaxed text-ink-muted sm:text-base">{slide.body}</p>

        {slide.stat && (
          <div className="mb-8 rounded-lg border border-ghost/30 bg-ghost/10 px-5 py-4">
            <div className="font-mono text-4xl font-bold tabular text-ghost sm:text-5xl">{slide.stat.value}</div>
            <div className="mt-1 text-sm text-ink-muted">{slide.stat.label}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-ghost" : "w-1.5 bg-surface-border hover:bg-ink-faint"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="min-h-[44px] rounded-lg bg-ghost px-5 text-sm font-medium text-surface hover:opacity-90"
          >
            {isLast ? "Explore the map →" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
