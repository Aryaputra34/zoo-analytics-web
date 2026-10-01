import { timingSafeEqual } from "node:crypto";
import { insertEvents, listEvents, type Ev, type Severity } from "@/lib/db";
import { dateParam, dayRange, fmtDateTime } from "@/lib/util";

const SEVERITIES = new Set(["info", "warning", "critical"]);
const isStr = (v: unknown, max = 200): v is string => typeof v === "string" && v.length > 0 && v.length <= max;

function authorized(req: Request) {
  const key = process.env.INGEST_API_KEY;
  if (!key) return true;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${key}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

// Ingest from zoo-monitor's AnalyticsDispatcher: {events: Event[]}.
// Invalid events are skipped (not rejected) so one bad event never makes the sender retry a batch forever.
export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.events) ? body.events : [];
  if (raw.length > 10_000) return Response.json({ error: "too many events (max 10000)" }, { status: 413 });

  const evs: Ev[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    const ts = Number(r?.timestampMs) || Date.parse(String(r?.timestamp));
    const data = r?.data;
    if (
      !isStr(r?.eventId, 64) ||
      !isStr(r.cameraId) ||
      !isStr(r.useCase) ||
      !isStr(r.eventType) ||
      !Number.isFinite(ts) ||
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    )
      continue;
    evs.push({
      id: r.eventId,
      ts,
      cameraId: r.cameraId,
      cameraName: isStr(r.cameraName) ? r.cameraName : r.cameraId,
      useCase: r.useCase,
      eventType: r.eventType,
      severity: (SEVERITIES.has(r.severity as string) ? r.severity : "info") as Severity,
      nxCameraId: isStr(r.nxCameraId) ? r.nxCameraId : null,
      data: data as Ev["data"],
    });
  }
  const inserted = await insertEvents(evs);
  return Response.json({ inserted, skipped: raw.length - evs.length });
}

// CSV export: ?date=&useCase=&eventType=&cameraId=  (status heartbeats only when eventType=status)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const date = dateParam(sp.get("date") ?? undefined);
  const [from, to] = dayRange(date);
  const eventType = sp.get("eventType") || undefined;
  const evs = (
    await listEvents({
      from,
      to,
      eventType,
      useCase: sp.get("useCase") || undefined,
      cameraId: sp.get("cameraId") || undefined,
      excludeStatus: !eventType,
    })
  ).reverse();

  const dataKeys = [...new Set(evs.flatMap((e) => Object.keys(e.data)))];
  const q = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["time_wib", "camera_id", "camera_name", "use_case", "event_type", "severity", ...dataKeys, "event_id"].map(q).join(","),
    ...evs.map((e) =>
      [fmtDateTime(e.ts), e.cameraId, e.cameraName, e.useCase, e.eventType, e.severity, ...dataKeys.map((k) => e.data[k]), e.id]
        .map(q)
        .join(","),
    ),
  ];
  const name = ["events", date, sp.get("useCase"), eventType].filter(Boolean).join("-");
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
