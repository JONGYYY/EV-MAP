// Same public, free, no-API-key US state boundary source used in
// chargehub_etl/phase46_crossborder_audit_fix.py for the point-in-polygon
// geocoding audit -- reused here so the map and the underlying data
// pipeline agree on the same state shapes.
const STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

export const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

export interface StateFeature {
  type: "Feature";
  properties: { name: string; abbr: string };
  geometry: GeoJSON.Geometry;
}

let cachedFeatures: StateFeature[] | null = null;

export async function loadStateFeatures(): Promise<StateFeature[]> {
  if (cachedFeatures) return cachedFeatures;
  const res = await fetch(STATES_GEOJSON_URL);
  const geo = await res.json();
  const features: StateFeature[] = geo.features
    .map((f: { properties: { name: string }; geometry: GeoJSON.Geometry }) => ({
      type: "Feature" as const,
      properties: { name: f.properties.name, abbr: STATE_NAME_TO_ABBR[f.properties.name] ?? "" },
      geometry: f.geometry,
    }))
    .filter((f: StateFeature) => f.properties.abbr); // drop PR/territories not in our matching table
  cachedFeatures = features;
  return features;
}
