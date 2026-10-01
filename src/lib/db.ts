// All database access lives here. To move to Postgres, rewrite this file only:
// use a `pg` Pool, `?` -> `$1..$n`, drop the PRAGMAs. The SQL below is portable.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { connection } from "next/server";

export type Severity = "info" | "warning" | "critical";

export type Ev = {
  id: string;
  ts: number;
  cameraId: string;
  cameraName: string;
  useCase: string;
  eventType: string;
  severity: Severity;
  nxCameraId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schemaless JSON payload per event type
  data: Record<string, any>;
};

const g = globalThis as unknown as { zooDb?: DatabaseSync };

function db() {
  if (!g.zooDb) {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    const d = new DatabaseSync(path.join(dir, "zoo.db"));
    d.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS events (
        event_id     TEXT PRIMARY KEY,
        ts_ms        BIGINT NOT NULL,
        camera_id    TEXT NOT NULL,
        camera_name  TEXT NOT NULL,
        use_case     TEXT NOT NULL,
        event_type   TEXT NOT NULL,
        severity     TEXT NOT NULL,
        nx_camera_id TEXT,
        data         TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS events_ts ON events(ts_ms);
      CREATE INDEX IF NOT EXISTS events_uc_type_ts ON events(use_case, event_type, ts_ms);
    `);
    g.zooDb = d;
  }
  return g.zooDb;
}

// node:sqlite rows are null-prototype objects; map to plain ones so they can cross into client components.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEv(r: any): Ev {
  return {
    id: r.event_id,
    ts: Number(r.ts_ms),
    cameraId: r.camera_id,
    cameraName: r.camera_name,
    useCase: r.use_case,
    eventType: r.event_type,
    severity: r.severity,
    nxCameraId: r.nx_camera_id,
    data: JSON.parse(r.data),
  };
}

export async function insertEvents(evs: Ev[]): Promise<number> {
  const d = db();
  const stmt = d.prepare(
    `INSERT INTO events (event_id, ts_ms, camera_id, camera_name, use_case, event_type, severity, nx_camera_id, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`,
  );
  let inserted = 0;
  d.exec("BEGIN");
  try {
    for (const e of evs) {
      const r = stmt.run(
        e.id,
        e.ts,
        e.cameraId,
        e.cameraName,
        e.useCase,
        e.eventType,
        e.severity,
        e.nxCameraId,
        JSON.stringify(e.data),
      );
      inserted += Number(r.changes);
    }
    d.exec("COMMIT");
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
  return inserted;
}

export async function listEvents(f: {
  from: number;
  to: number;
  useCase?: string;
  eventType?: string;
  cameraId?: string;
  excludeStatus?: boolean;
}): Promise<Ev[]> {
  await connection(); // sync driver: keep this out of prerendering
  let sql = "SELECT * FROM events WHERE ts_ms BETWEEN ? AND ?";
  const args: (string | number)[] = [f.from, f.to];
  for (const [col, val] of [
    ["use_case", f.useCase],
    ["event_type", f.eventType],
    ["camera_id", f.cameraId],
  ]) {
    if (val) {
      sql += ` AND ${col} = ?`;
      args.push(val);
    }
  }
  if (f.excludeStatus) sql += " AND event_type <> 'status'";
  return db()
    .prepare(sql + " ORDER BY ts_ms DESC")
    .all(...args)
    .map(toEv);
}

// Newest status event per camera (seen in the last 7 days).
export async function latestStatus(): Promise<Ev[]> {
  await connection();
  const rows = db()
    .prepare(
      `SELECT e.* FROM events e
       JOIN (SELECT camera_id, MAX(ts_ms) AS m FROM events
             WHERE event_type = 'status' AND ts_ms > ? GROUP BY camera_id) l
         ON e.camera_id = l.camera_id AND e.ts_ms = l.m AND e.event_type = 'status'
       ORDER BY e.camera_name`,
    )
    .all(Date.now() - 7 * 86_400_000);
  // two status rows with the same ms are possible; keep one per camera
  return [...new Map(rows.map(toEv).map((e) => [e.cameraId, e])).values()];
}
