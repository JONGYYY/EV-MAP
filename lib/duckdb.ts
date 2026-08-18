// DuckDB-WASM, initialized lazily -- only the first time a user clicks a
// station, not on initial page load (keeps the base map bundle small).
// Uses jsDelivr-hosted bundles rather than self-hosting the WASM/worker
// assets, which avoids Next.js webpack config for .wasm/worker files.
import * as duckdb from "@duckdb/duckdb-wasm";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db;
}

function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) dbPromise = initDuckDB();
  return dbPromise;
}

export interface HistoryMonth {
  year: number;
  month: number;
  bucket_top: "ZERO_EVENT" | "HAS_EVENTS" | "NO_DATA" | null;
  avg_ports_in_use: number | null;
}

export async function queryStationHistory(locId: number): Promise<HistoryMonth[]> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const url = `${window.location.origin}/data/station_history.parquet`;
    const result = await conn.query(`
      SELECT year, month, bucket_top, avg_ports_in_use
      FROM read_parquet('${url}')
      WHERE LocID = ${locId}
      ORDER BY year, month
    `);
    return result.toArray().map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      bucket_top: r.bucket_top as HistoryMonth["bucket_top"],
      avg_ports_in_use: r.avg_ports_in_use === null ? null : Number(r.avg_ports_in_use),
    }));
  } finally {
    await conn.close();
  }
}
