"use client";

import { useEffect, useState } from "react";

interface Metadata {
  panel_through: string;
  afdc_pulled_at: string;
  export_generated_at: string;
}

export default function FreshnessBadge() {
  const [meta, setMeta] = useState<Metadata | null>(null);

  useEffect(() => {
    fetch("/data/metadata.json")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  if (!meta) return null;

  return (
    <div className="glass-panel flex flex-col gap-0.5 rounded-lg px-3 py-2 text-[11px] shadow-lg">
      <span className="text-ink-muted">
        Panel data through <span className="font-mono tabular text-ink">{meta.panel_through}</span>
      </span>
      <span className="text-ink-faint">
        AFDC cross-checked <span className="font-mono tabular text-ink-muted">{meta.afdc_pulled_at}</span> —
        our panel updates continuously, the locator does not
      </span>
    </div>
  );
}
