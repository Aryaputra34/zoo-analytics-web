import type { Ev } from "./db";

// ponytail: fixed UTC+7 — WIB has no DST.
const WIB = 7 * 3_600_000;
const DAY = 86_400_000;

// Must match STATUS_INTERVAL_SEC in zoo-vision services/engine/core/base_pipeline.py.
export const STATUS_SEC = 30;

const wibIso = (ts: number) => new Date(ts + WIB).toISOString();
export const todayWib = () => wibIso(Date.now()).slice(0, 10);
export const fmtTime = (ts: number) => wibIso(ts).slice(11, 19);
export const fmtHm = (ts: number) => wibIso(ts).slice(11, 16);
export const fmtDateTime = (ts: number) => wibIso(ts).slice(0, 19).replace("T", " ");
export const dayOf = (ts: number) => wibIso(ts).slice(0, 10);
export const hourOf = (ts: number) => wibIso(ts).slice(11, 13);

export function dayRange(date: string): [number, number] {
  const from = Date.parse(`${date}T00:00:00+07:00`);
  return [from, from + DAY - 1];
}

export const isOnline = (status: Ev | undefined) => !!status && Date.now() - status.ts < 3 * STATUS_SEC * 1000;

export const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function dateParam(v: string | string[] | undefined) {
  const s = str(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : todayWib();
}

export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

// 24 rows {hour: "08", key: sum} for an hourly chart.
export function byHour<K extends string>(evs: Ev[], series: Record<K, (e: Ev) => number>) {
  const keys = Object.keys(series) as K[];
  const rows = Array.from({ length: 24 }, (_, h) => {
    const row = { hour: String(h).padStart(2, "0") } as { hour: string } & Record<K, number>;
    for (const k of keys) row[k] = 0 as never;
    return row;
  });
  for (const e of evs) {
    const row = rows[Number(hourOf(e.ts))];
    for (const k of keys) row[k] = (row[k] + series[k](e)) as never;
  }
  return rows;
}

// Trim leading/trailing empty hours so the chart focuses on operating hours (keeps 08–17 at least).
export function operatingHours<T extends { hour: string }>(rows: T[], isEmpty: (r: T) => boolean) {
  let a = rows.findIndex((r) => !isEmpty(r));
  let b = rows.findLastIndex((r) => !isEmpty(r));
  if (a < 0) [a, b] = [8, 17];
  return rows.slice(Math.min(a, 8), Math.max(b, 17) + 1);
}

export const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
export const fmtNum = (n: number) => n.toLocaleString("en-US");
export const fmtMin = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}m` : `${Math.round(min)}m`);

export const USE_CASES: Record<string, string> = {
  vehicle_gate: "Vehicle gate",
  cashier_presence: "Cashier",
  restaurant_counter: "Restaurant",
  restaurant_table: "Restaurant tables",
  horse_riding: "Pony rides",
};

export const EVENT_TYPES: Record<string, string> = {
  vehicle_crossing: "Vehicle crossing",
  cashier_unattended: "Desk unattended",
  customer_waiting: "Customer waiting",
  capacity_alert: "Capacity alert",
  table_state_change: "Table seated / vacated",
  horse_crossing: "Pony crossing",
  status: "Status (heartbeat)",
};

// Event data fields that point at evidence (shown by <Evidence>), not telemetry.
const EVIDENCE_KEYS = new Set(["snapshot", "recordingPath"]);

// One-line human description of an event.
export function describe(e: Ev): string {
  const d = e.data;
  switch (e.eventType) {
    case "vehicle_crossing":
      return `${d.direction === "ENTRY" ? "Masuk (Entry)" : "Keluar (Exit)"} · ${d.vehicleType || "Kendaraan"}${d.trackerId ? ` · Ref #${d.trackerId}` : ""}`;
    case "cashier_unattended":
      return `Desk unattended for ${d.absentSec}s`;
    case "customer_waiting":
      return `Customer waiting ${d.waitingSec}s with no cashier`;
    case "capacity_alert":
      return `${d.level === "full" ? "Full" : "Near limit"} · ${d.occupancy}/${d.maxCapacity} people`;
    case "horse_crossing":
      return d.direction === "DEPARTURE" ? "Pony departed" : "Pony returned";
    case "table_state_change":
      return d.status === "OCCUPIED"
        ? `${d.tableName ?? d.tableId} · guests seated`
        : `${d.tableName ?? d.tableId} · vacated${d.dwellSec ? ` after ${fmtMin(d.dwellSec / 60)}` : ""}`;
    default:
      return Object.entries(d)
        .filter(([k]) => !EVIDENCE_KEYS.has(k))
        .map(([k, v]) => `${k}=${v}`)
        .join(" · ");
  }
}
