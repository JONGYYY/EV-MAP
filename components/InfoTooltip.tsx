"use client";

import { useId, useState } from "react";

// Small "info" affordance: visually a tiny circled "i", but with a much
// larger invisible hit area (~44x44, the touch-target guideline) so it's
// still easy to hit/tap without inflating the compact stat-row layouts it
// sits in. Works on hover AND keyboard focus, not hover-only.
//
// `align` controls which side the tooltip box grows from: "start" (default)
// anchors its left edge to the button and grows rightward -- correct for
// icons that sit near the left/start of their container (most labels).
// "end" anchors its right edge and grows leftward instead, for icons that
// sit near the right edge of a right-docked panel (e.g. StationPanel, which
// hugs the viewport's right edge, leaving no room to grow right).
export default function InfoTooltip({ text, align = "start" }: { text: string; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-4 w-4 items-center justify-center rounded-full border border-surface-border text-[9px] font-semibold leading-none text-ink-faint hover:border-ink-faint hover:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ghost/60"
      >
        <span className="absolute -inset-[13px]" aria-hidden="true" />
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`glass-panel pointer-events-none absolute top-full z-20 mt-1.5 w-52 rounded-md px-2.5 py-2 text-xs font-normal leading-snug text-ink shadow-2xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
