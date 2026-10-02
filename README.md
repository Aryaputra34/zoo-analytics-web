# Zoo Analytics (web dashboard)

Live and daily reporting for the **zoo-monitor** AI camera system: vehicle gate counts and plates,
cashier desk presence, restaurant and table occupancy, and pony-ride departures. Also a live annotated
camera view, and a snapshot plus recorded clip for every event.

```
zoo-monitor pipelines ──AnalyticsDispatcher──▶ POST /api/events ──▶ data/zoo.db (SQLite)
                                                                        ▲
                         dashboard pages (server-rendered, refresh every 5 s) ┘

browser ──▶ /api/ai/*  ──▶ zoo-monitor AI engine :8000   (live preview, frames, event snapshots)
        ──▶ /api/clip  ──▶ MediaMTX playback :9996       (MP4 from 15 s before to 15 s after an event)
```

The browser only ever talks to the dashboard. Every page and API sits behind the login, except the
event ingest, which has its own key.

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

For a full command matrix across all 5 pipelines (gate, cashier, restaurant, tables, horse), see [08_TESTING_GUIDE.md](../zoo-monitor/docs/08_TESTING_GUIDE.md).

### Configuration (`.env.local`)

Copy `.env.example` to create your local environment file:

```bash
cp .env.example .env.local
```

```env
# Login: one shared password for all users. Leave it out = no login (local development only).
DASHBOARD_PASSWORD=some-long-password
# POST /api/events then requires "Authorization: Bearer <key>" (= analytics.api_key in zoo-monitor)
INGEST_API_KEY=some-long-random-string
# zoo-monitor AI engine API (api_server in app_config.yaml): /live page and event snapshots
AI_ENGINE_URL=http://127.0.0.1:8000
AI_ENGINE_API_KEY=same-as-api_server.api_key
# MediaMTX playback server (zoo-monitor configs/mediamtx.yml): "play clip" on events
MEDIAMTX_PLAYBACK_URL=http://127.0.0.1:9996
```

Each setting is optional. Without `AI_ENGINE_URL`, events show no snapshot and `/live` says the engine
isn't connected. Without `MEDIAMTX_PLAYBACK_URL`, there are no clips.

About the login:
* Sessions last 7 days. Changing `DASHBOARD_PASSWORD` signs everyone out.
* The cookie is marked `Secure` only when the dashboard is served over https.

## Pages

| Page | What it shows |
|---|---|
| `/` Overview | Today's headline numbers, camera online/offline status, latest alerts |
| `/live` | Every AI camera with its zones and detections drawn in (stills every 2 s); click one for live MJPEG |
| `/vehicles` | Entries/exits per hour, vehicle types, searchable plate log |
| `/cashier` | Per desk: time unattended, alerts, live state |
| `/restaurant` | Occupancy through the day vs warning/max capacity; per-table status, seatings and average stay |
| `/rides` | Pony departures/returns, last 14 days, CSV for POS reconciliation |
| `/events` | Raw event log with filters and CSV export |
| `/login`, `/logout` | Shared-password login (only when `DASHBOARD_PASSWORD` is set) |

Event tables have a **Bukti** (evidence) column: the event's snapshot, which opens the full image and
the recorded clip.

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
| `restaurant_table` (or `restaurant_counter` with tables) | `table_state_change` | `tableId`, `tableName`, `oldStatus`, `status` OCCUPIED/EMPTY, `dwellSec` (stay length when vacated) |
| all except `status` | (any) | evidence, when available: `snapshot` (path on the AI engine), `recordingPath` (MediaMTX path) |
| all | `status` (every 30 s) | live state: cashier `state, clerkPresent, clerkCount, visitorCount` · restaurant `occupancy, rawOccupancy, maxCapacity, warningCapacity, mode` · gate `inCount, outCount, anprEnabled` · horse `activeHorses, departures, returns` |

`GET /api/events?date=&useCase=&eventType=&cameraId=` downloads the matching events as CSV.

## Documentation

- **[Interactive Swagger UI (`/api-docs`)](http://localhost:3000/api-docs)**: Interactive in-browser API testing with "Try it out", schema viewer, and Bearer auth.
- **[API Reference (`docs/API.md`)](docs/API.md)**: Full endpoint reference, payload schemas, architecture diagrams, and Python/cURL code examples.
- **[OpenAPI Specification (`docs/openapi.yaml`)](docs/openapi.yaml)**: OpenAPI 3.1.0 standard specification (raw at [`/api/openapi.yaml`](http://localhost:3000/api/openapi.yaml)) for Postman, Insomnia, and SDK generation.

## Code map

- `src/lib/db.ts`: **all** SQL. To move to Postgres, rewrite only this file (`pg` Pool, `?` → `$1…`, drop the PRAGMAs).
- `src/lib/util.ts`: WIB time helpers, hourly bucketing, labels.
- `src/app/api/events/route.ts`: ingest + CSV.
- `src/app/api/ai/[...path]/route.ts`, `src/app/api/clip/route.ts`: pass-throughs to the AI engine and MediaMTX.
- `src/proxy.ts`, `src/lib/session.ts`, `src/app/login/`: the login gate.
- `src/app/*/page.tsx`: pages (server components reading `db.ts` directly).
- `src/components/`: `ui.tsx` (tiles, tables, badges) and `client.tsx` (charts, nav, auto-refresh).
- `scripts/seed.mjs`: demo data.

