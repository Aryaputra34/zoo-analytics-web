# Zoo Analytics (web dashboard)

Live and daily reporting for the **zoo-monitor** AI camera system: vehicle gate counts and plates,
cashier desk presence, restaurant occupancy, and pony-ride departures.

```
zoo-monitor pipelines ──AnalyticsDispatcher──▶ POST /api/events ──▶ data/zoo.db (SQLite)
                                                                        ▲
                         dashboard pages (server-rendered, refresh every 5 s) ┘
```

## Run

```bash
npm install
npm run dev            # http://localhost:3000
```

Requires Node 22.13+ (uses the built-in `node:sqlite`; Node prints a one-time ExperimentalWarning, which is harmless).
The database file is created automatically in `data/zoo.db` (git-ignored).

### Demo data

```bash
npm run seed                  # today so far + previous 6 days of realistic fake events
npm run seed -- --days 1      # today only
npm run seed -- --live        # then keep sending heartbeats/crossings like a running CV service
```

Seeding is reproducible: re-running inserts only events that are new since the last run.
Seeded events have ids starting with `seed_` / `live_`.

### Real data from zoo-monitor

In `zoo-monitor/configs/app_config.yaml`:

```yaml
analytics:
  enabled: true
  api_url: "http://localhost:3000/api/events"
  api_key: ""        # must equal INGEST_API_KEY below (empty = no auth)
```

Then `python main.py` (all enabled cameras), or test a single video with
`python test_video.py --video <file.mp4> --pipeline horse --analytics`.

### Protecting the ingest API

Create `.env.local`:

```
INGEST_API_KEY=some-long-random-string
```

`POST /api/events` then requires `Authorization: Bearer <key>`. The dashboard pages themselves have no login;
run it on the internal network.

## Pages

| Page | What it shows |
|---|---|
| `/` Overview | Today's headline numbers, camera online/offline status, latest alerts |
| `/vehicles` | Entries/exits per hour, vehicle types, searchable plate log |
| `/cashier` | Per desk: time unattended, alerts, live state |
| `/restaurant` | Occupancy through the day vs warning/max capacity |
| `/rides` | Pony departures/returns, last 14 days, CSV for POS reconciliation |
| `/events` | Raw event log with filters and CSV export |

Every page takes `?date=YYYY-MM-DD` (WIB). A camera counts as **online** when its last heartbeat
(`status` event, sent every 30 s) is less than 90 s old.

## Event contract

`POST /api/events` with `{ "events": [Event, ...] }`; returns `{ inserted, skipped }`.
Duplicate `eventId`s are ignored, so senders can safely retry. Invalid events are skipped.

```jsonc
{
  "eventId": "evt_1a2b3c4d5e6f", "timestampMs": 1790000000000, "timestamp": "2026-10-01T03:00:00Z",
  "cameraId": "cam_gate_entry_01", "cameraName": "Main Vehicle Gate 1", "nxCameraId": "…",
  "useCase": "vehicle_gate", "eventType": "vehicle_crossing", "severity": "info",
  "data": { "direction": "ENTRY", "vehicleType": "car", "plate": "B 1234 ABC", "plateValid": true, "ocrConfidence": 0.91, "trackerId": 17 }
}
```

| useCase | eventType | data |
|---|---|---|
| `vehicle_gate` | `vehicle_crossing` | `direction` ENTRY/EXIT, `vehicleType`, `plate` (or `UNIDENTIFIED`), `plateValid`, `ocrConfidence`, `trackerId` |
| `cashier_presence` | `cashier_unattended` (warning) | `absentSec` |
| `cashier_presence` | `customer_waiting` (critical) | `waitingSec` |
| `restaurant_counter` | `capacity_alert` (warning/critical) | `occupancy`, `maxCapacity`, `warningCapacity`, `level` near_limit/full |
| `horse_riding` | `horse_crossing` | `direction` DEPARTURE/RETURN, `trackerId` |
| all | `status` (every 30 s) | live state: cashier `state, clerkPresent, clerkCount, visitorCount` · restaurant `occupancy, rawOccupancy, maxCapacity, warningCapacity, mode` · gate `inCount, outCount, anprEnabled` · horse `activeHorses, departures, returns` |

`GET /api/events?date=&useCase=&eventType=&cameraId=` downloads the matching events as CSV.

## Code map

- `src/lib/db.ts`: **all** SQL. To move to Postgres, rewrite only this file (`pg` Pool, `?` → `$1…`, drop the PRAGMAs).
- `src/lib/util.ts`: WIB time helpers, hourly bucketing, labels.
- `src/app/api/events/route.ts`: ingest + CSV.
- `src/app/*/page.tsx`: pages (server components reading `db.ts` directly).
- `src/components/`: `ui.tsx` (tiles, tables, badges) and `client.tsx` (charts, nav, auto-refresh).
- `scripts/seed.mjs`: demo data.
