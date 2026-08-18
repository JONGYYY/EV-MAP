"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import IntroSequence, { shouldShowIntroOnLoad } from "@/components/IntroSequence";

// WebGL (MapLibre/deck.gl) can't render server-side.
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Page() {
  // null = not yet determined (avoids a flash of the wrong state before
  // localStorage can be read on the client); true/false once known.
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    setShowIntro(shouldShowIntroOnLoad());
  }, []);

  return (
    <>
      <Map onReplayIntro={() => setShowIntro(true)} />
      {showIntro && <IntroSequence onDone={() => setShowIntro(false)} />}
    </>
  );
}
