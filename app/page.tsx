import dynamic from "next/dynamic";

// WebGL (MapLibre/deck.gl) can't render server-side.
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Page() {
  return <Map />;
}
