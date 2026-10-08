// Demo data: POSTs realistic fake zoo-vision events through the real ingest API.
//   npm run seed                 -> today + previous 6 days (08:00–17:30 WIB, today capped at now)
//   npm run seed -- --days 1     -> today only
//   npm run seed -- --live       -> after seeding, keep sending heartbeats + crossings like a running CV service
// Reproducible: same date -> same events (seeded PRNG, ids seed_<date>_<n>), so re-running inserts 0.

const URL_ = (process.env.DASHBOARD_URL || "http://localhost:3000") + "/api/events";
const KEY = process.env.INGEST_API_KEY;
const args = process.argv.slice(2);
const DAYS = Number(args[args.indexOf("--days") + 1]) || 7;
const LIVE = args.includes("--live");
const STATUS_MS = 30_000; // = STATUS_INTERVAL_SEC in zoo-vision

const CAM = {
  cashier: {
    id: "cam_cashier_01",
    name: "Loket Mini Train Cashier",
    nx: "00000000-0000-0000-0000-000000000001",
    uc: "cashier_presence",
  },
  restaurant: {
    id: "cam_restaurant_01",
    name: "Safari Cafe Dining Hall",
    nx: "00000000-0000-0000-0000-000000000002",
    uc: "restaurant_counter",
  },
  gate: { id: "cam_gate_entry_01", name: "Main Vehicle Gate 1", nx: "00000000-0000-0000-0000-000000000003", uc: "vehicle_gate" },
  horse: {
    id: "cam_horse_01",
    name: "Horse Riding Departure Choke Point",
    nx: "00000000-0000-0000-0000-000000000005",
    uc: "horse_riding",
  },
};

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function generateDay(date, until) {
  const rnd = mulberry32(hash(date));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const at = (h) => Date.parse(`${date}T00:00:00+07:00`) + h * 3_600_000; // hour (WIB, fractional) -> ms
  const open = at(8),
    close = at(17.5);
  let n = 0;
  const evs = [];
  const ev = (cam, eventType, ts, data, severity = "info") => {
    const id = n++; // always advance, so ids stay stable as "until" moves forward during the day
    if (ts > until) return;
    evs.push({
      eventId: `seed_${date}_${id}`,
      timestamp: new Date(ts).toISOString().slice(0, 19) + "Z",
      timestampMs: Math.round(ts),
      cameraId: cam.id,
      cameraName: cam.name,
      useCase: cam.uc,
      eventType,
      severity,
      nxCameraId: cam.nx,
      data,
    });
  };

  // Vehicles: entries peak in the morning; each car leaves 1.5–5 h later with the same plate.
  const plate = () =>
    `${pick(["B", "B", "B", "D", "F", "AB", "L", "H", "AD", "N"])} ${Math.floor(between(1, 9999))} ${Array.from(
      { length: 1 + Math.floor(rnd() * 3) },
      () => pick("ABCDEFGHJKLMNPRSTUVWXYZ"),
    ).join("")}`;
  const crossings = [];
  for (let i = 0, total = Math.round(between(140, 190)); i < total; i++) {
    const tIn = at(8 + Math.min(rnd(), rnd()) * 7);
    const type = rnd() < 0.6 ? "car" : rnd() < 0.75 ? "motorcycle" : rnd() < 0.5 ? "bus" : "truck";
    const read = rnd() > 0.15;
    const p = read ? plate() : "UNIDENTIFIED";
    const base = {
      vehicleType: type,
      plate: p,
      plateValid: read && rnd() > 0.08,
      ocrConfidence: read ? +between(0.55, 0.98).toFixed(2) : 0,
    };
    crossings.push({ ts: tIn, ...base, direction: "ENTRY" });
    const tOut = tIn + between(1.5, 5) * 3_600_000;
    if (tOut < close) crossings.push({ ts: tOut, ...base, direction: "EXIT" });
  }
  crossings.sort((a, b) => a.ts - b.ts);
  let tid = 1000;
  for (const { ts, ...d } of crossings) ev(CAM.gate, "vehicle_crossing", ts, { ...d, trackerId: tid++ });

  // Pony rides: departures 08:30–16:30, busier midday; each returns 5–9 min later.
  const rides = [];
  for (let i = 0, total = Math.round(between(60, 95)); i < total; i++) {
    const t = at(8.5 + ((rnd() + rnd() + rnd()) / 3) * 8);
    rides.push({ ts: t, direction: "DEPARTURE" }, { ts: t + between(5, 9) * 60_000, direction: "RETURN" });
  }
  rides.sort((a, b) => a.ts - b.ts);
  for (const r of rides) ev(CAM.horse, "horse_crossing", r.ts, { direction: r.direction, trackerId: tid++ });

  // Cashier: a few absence episodes; alerts follow the pipeline's 10 s timeout + 30 s debounce.
  const absences = Array.from({ length: 3 + Math.floor(rnd() * 4) }, () => {
    const s = at(between(8.3, 16.8));
    return [s, s + between(1, 9) * 60_000, rnd() < 0.5];
  });
  for (const [s, e, waiting] of absences) {
    for (let t = s + 10_000; t < e; t += 30_000)
      ev(CAM.cashier, "cashier_unattended", t, { absentSec: Math.round((t - s) / 1000) }, "warning");
    if (waiting)
      for (let t = s + 60_000; t < e; t += 30_000)
        ev(CAM.cashier, "customer_waiting", t, { waitingSec: Math.round((t - s - 55_000) / 1000) }, "critical");
  }

  // Restaurant occupancy: lunch peak (sometimes over capacity) + smaller afternoon bump.
  const peak = between(38, 66);
  const occAt = (t) => {
    const h = (t - at(0)) / 3_600_000;
    const v = 4 + peak * Math.exp(-(((h - 12.4) / 0.9) ** 2)) + 16 * Math.exp(-(((h - 15.3) / 0.7) ** 2)) + between(-2, 2);
    return Math.max(0, Math.round(v));
  };
  let lastAlert = 0;

  // Status heartbeats every 30 s for every camera.
  let inC = 0,
    outC = 0,
    dep = 0,
    ret = 0,
    ci = 0,
    ri = 0;
  for (let t = open; t <= close; t += STATUS_MS) {
    for (; ci < crossings.length && crossings[ci].ts <= t; ci++) {
      if (crossings[ci].direction === "ENTRY") inC++;
      else outC++;
    }
    for (; ri < rides.length && rides[ri].ts <= t; ri++) {
      if (rides[ri].direction === "DEPARTURE") dep++;
      else ret++;
    }
    const abs = absences.find(([s, e]) => t >= s && t < e);
    const visitors = Math.floor(rnd() * 3);
    const state = abs
      ? abs[2] && t - abs[0] > 60_000
        ? `ALERT: CUSTOMER WAITING (${Math.round((t - abs[0] - 55_000) / 1000)}s)`
        : `STATUS: UNATTENDED (${Math.round((t - abs[0]) / 1000)}s)`
      : visitors
        ? "SERVING CUSTOMER"
        : "CASHIER PRESENT (IDLE)";
    ev(CAM.cashier, "status", t, {
      state,
      clerkPresent: !abs,
      clerkCount: abs ? 0 : 1,
      visitorCount: abs && abs[2] ? 1 : visitors,
    });

    const occ = occAt(t);
    ev(CAM.restaurant, "status", t, {
      occupancy: occ,
      rawOccupancy: occ + Math.round(between(-2, 2)),
      maxCapacity: 60,
      warningCapacity: 45,
      mode: "area_occupancy",
    });
    if (occ >= 45 && t - lastAlert >= 60_000) {
      lastAlert = t;
      const full = occ >= 60;
      ev(
        CAM.restaurant,
        "capacity_alert",
        t + 1,
        { occupancy: occ, maxCapacity: 60, warningCapacity: 45, level: full ? "full" : "near_limit" },
        full ? "critical" : "warning",
      );
    }
    ev(CAM.gate, "status", t, { inCount: inC, outCount: outC, anprEnabled: true });
    ev(CAM.horse, "status", t, { activeHorses: Math.min(dep - ret, Math.floor(rnd() * 3)), departures: dep, returns: ret });
  }
  return evs;
}

async function post(events) {
  let inserted = 0;
  for (let i = 0; i < events.length; i += 1000) {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(KEY && { Authorization: `Bearer ${KEY}` }) },
      body: JSON.stringify({ events: events.slice(i, i + 1000) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${URL_}: ${await res.text()}`);
    inserted += (await res.json()).inserted;
  }
  return inserted;
}

const wibDate = (ts) => new Date(ts + 7 * 3_600_000).toISOString().slice(0, 10);
const now = Date.now();
const all = [];
for (let d = DAYS - 1; d >= 0; d--) all.push(...generateDay(wibDate(now - d * 86_400_000), now));

const summary = {};
for (const e of all) {
  const k = e.data.direction ? `${e.eventType}:${e.data.direction}` : e.eventType;
  summary[k] = (summary[k] || 0) + 1;
}
try {
  const inserted = await post(all);
  console.log(`Seeded ${DAYS} day(s) -> ${URL_}\ngenerated ${all.length}, inserted ${inserted} (rest already present)`);
  console.table(summary);
} catch (e) {
  console.error(`Seed failed: ${e.message}\nIs the dashboard running (npm run dev)?`);
  process.exit(1);
}

if (LIVE) {
  // Behave like a running CV service: heartbeats every 30 s, random crossings in between.
  console.log("Live mode: sending heartbeats + crossings. Ctrl+C to stop.");
  let seq = 0,
    inC = 0,
    outC = 0,
    dep = 0,
    ret = 0;
  const mk = (cam, eventType, data, severity = "info") => ({
    eventId: `live_${now}_${seq++}`,
    timestamp: new Date().toISOString().slice(0, 19) + "Z",
    timestampMs: Date.now(),
    cameraId: cam.id,
    cameraName: cam.name,
    useCase: cam.uc,
    eventType,
    severity,
    nxCameraId: cam.nx,
    data,
  });
  let occ = 20;
  const tick = async (withStatus) => {
    const evs = [];
    if (Math.random() < 0.5) {
      const direction = Math.random() < 0.55 ? "ENTRY" : "EXIT";
      if (direction === "ENTRY") inC++;
      else outC++;
      evs.push(
        mk(CAM.gate, "vehicle_crossing", {
          direction,
          vehicleType: Math.random() < 0.65 ? "car" : "motorcycle",
          plate: `B ${1000 + Math.floor(Math.random() * 8999)} LIV`,
          plateValid: true,
          ocrConfidence: 0.9,
          trackerId: seq,
        }),
      );
    }
    if (Math.random() < 0.15) {
      const direction = dep > ret && Math.random() < 0.5 ? "RETURN" : "DEPARTURE";
      if (direction === "DEPARTURE") dep++;
      else ret++;
      evs.push(mk(CAM.horse, "horse_crossing", { direction, trackerId: seq }));
    }
    if (withStatus) {
      occ = Math.max(0, Math.min(65, occ + Math.round(Math.random() * 8 - 4)));
      evs.push(
        mk(CAM.cashier, "status", { state: "CASHIER PRESENT (IDLE)", clerkPresent: true, clerkCount: 1, visitorCount: 0 }),
        mk(CAM.restaurant, "status", {
          occupancy: occ,
          rawOccupancy: occ,
          maxCapacity: 60,
          warningCapacity: 45,
          mode: "area_occupancy",
        }),
        mk(CAM.gate, "status", { inCount: inC, outCount: outC, anprEnabled: true }),
        mk(CAM.horse, "status", { activeHorses: Math.min(dep - ret, 2), departures: dep, returns: ret }),
      );
    }
    await post(evs).catch((e) => console.error(e.message));
  };
  let i = 0;
  await tick(true);
  setInterval(() => tick(++i % 6 === 0), 5_000);
}
