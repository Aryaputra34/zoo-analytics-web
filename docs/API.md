# Zoo Analytics Web API Documentation

> **Base URL**: `http://localhost:3000` (development) or production host  
> **API Version**: `1.0.0`  
> **Interactive Swagger UI**: [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)  
> **OpenAPI Specification**: [`docs/openapi.yaml`](./openapi.yaml) (raw: [`/api/openapi.yaml`](http://localhost:3000/api/openapi.yaml))

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Authentication & Security](#2-authentication--security)
3. [Endpoints Reference](#3-endpoints-reference)
   - [POST /api/events (Ingest)](#post-apievents)
   - [GET /api/events (CSV Export)](#get-apievents)
   - [GET /api/ai/health (AI Engine Health)](#get-apiaistatus--health)
   - [GET /api/ai/frame/:cameraId (Live AI Frame)](#get-apiaiframecameraid)
   - [GET /api/ai/stream/:cameraId (MJPEG Live Stream)](#get-apiaistreamcameraid)
   - [GET /api/ai/snapshots/:path (Event Snapshot)](#get-apiaisnapshotspath)
   - [GET /api/clip (MediaMTX 30s Replay)](#get-apiclip)
   - [GET /logout (Session Logout)](#get-logout)
4. [Event Schemas & Use Cases](#4-event-schemas--use-cases)
5. [Code Examples](#5-code-examples)

---

## 1. Overview & Architecture

`zoo-analytics-web` serves as the centralized operational dashboard and analytics ingestion gateway for the Taman Safari **zoo-monitor** ecosystem.

```
┌────────────────────────────────────────────────────────┐
│                   zoo-monitor (Edge AI)               │
│  - Pipeline AI (YOLO, DeepSORT, Tripwires)             │
│  - api_server.py (:8000)                               │
└────────┬──────────────────────────────┬────────────────┘
         │ (POST /api/events)           │ (HTTP Proxy /api/ai/*)
         ▼                              ▼
┌────────────────────────────────────────────────────────┐
│                zoo-analytics-web (:3000)               │
│  - Ingest Engine (SQLite DB with WAL mode)             │
│  - Server Components & Realtime Dashboards             │
│  - Security Gateway (HMAC Cookie & Bearer Token)       │
└────────▲──────────────────────────────▲────────────────┘
         │ (HTTP Proxy /api/clip)       │
         │                              │ (Web Browser)
┌────────┴──────────────┐      ┌────────┴────────────────┐
│   MediaMTX (:9996)    │      │    Operators / Staff    │
│  - Recorded MP4 clips │      │  - Desktop & Tablets    │
└───────────────────────┘      └─────────────────────────┘
```

The browser only connects directly to `zoo-analytics-web`. Upstream connections to the AI engine (`:8000`) and the MediaMTX playback server (`:9996`) are proxied server-side, preventing internal network exposure.

---

## 2. Authentication & Security

The API uses two distinct authentication layers:

### A. Machine-to-Machine Ingestion (`POST /api/events`)
- **Scheme**: HTTP Bearer Authentication.
- **Header**: `Authorization: Bearer <INGEST_API_KEY>`
- **Configuration**: Set `INGEST_API_KEY` in `.env.local`.
- If `INGEST_API_KEY` is not defined in the environment, requests are accepted without authentication (development mode only).
- Bypasses web session cookies so that edge AI services never require user logins.

### B. Dashboard & Proxy Endpoints (`GET /api/*`)
- **Scheme**: HMAC-signed session cookie (`zoo_session`).
- **Cookie Format**: `<expiry_epoch_ms>.<hmac_signature>`
- **Lifetime**: 7 days (rolling).
- **Configuration**: Set `DASHBOARD_PASSWORD` in `.env.local`. Changing the password immediately invalidates all active sessions.
- In development mode (where `DASHBOARD_PASSWORD` is omitted), authentication is disabled.

---

## 3. Endpoints Reference

### `POST /api/events`

Ingests a batch of AI telemetry events and heartbeats from edge pipelines.

- **URL**: `/api/events`
- **Method**: `POST`
- **Auth**: `Authorization: Bearer <INGEST_API_KEY>`
- **Rate Limit / Limits**: Maximum 10,000 events per batch.
- **Idempotency**: Duplicate `eventId`s are safely ignored (`ON CONFLICT (id) DO NOTHING`).

#### Request Headers
| Header | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | Required |
| `Authorization` | `Bearer <INGEST_API_KEY>` | Required if `INGEST_API_KEY` is set |

#### Request Body
```json
{
  "events": [
    {
      "eventId": "evt_20261002_001",
      "cameraId": "cam-gate-01",
      "cameraName": "Main Gate In",
      "useCase": "vehicle_gate",
      "eventType": "vehicle_entry",
      "severity": "info",
      "timestampMs": 1727870400000,
      "nxCameraId": "f7d24a91-...",
      "data": {
        "vehicleType": "CAR",
        "direction": "IN",
        "trackerId": 45,
        "snapshot": "gate/snap_45.jpg",
        "recordingPath": "cam-gate-01"
      }
    }
  ]
}
```

#### Fields Description
| Field | Type | Required | Description |
|---|---|---|---|
| `eventId` | `string` | Yes | Unique identifier (max 64 chars). |
| `cameraId` | `string` | Yes | Source camera identifier. |
| `cameraName` | `string` | No | Human-readable camera label (defaults to `cameraId`). |
| `useCase` | `string` | Yes | Pipeline type: `vehicle_gate`, `cashier_presence`, `restaurant_counter`, `restaurant_table`, `horse_riding`. |
| `eventType` | `string` | Yes | Specific action: `vehicle_entry`, `vehicle_exit`, `cashier_unattended`, `customer_waiting`, `capacity_alert`, `table_state_change`, `horse_crossing`, `status`. |
| `severity` | `string` | No | Alert tier: `"info"` (default), `"warning"`, `"critical"`. |
| `timestampMs` | `number` | Yes* | Timestamp in epoch milliseconds (*or ISO string in `timestamp`). |
| `nxCameraId` | `string` | No | Camera GUID in Nx Witness VMS. |
| `data` | `object` | Yes | JSON object containing telemetry and evidence paths. |

#### Response Codes
- `200 OK`: Batch processed successfully.
  ```json
  { "inserted": 1, "skipped": 0 }
  ```
- `401 Unauthorized`: Missing or invalid Bearer token.
- `413 Payload Too Large`: Batch exceeds 10,000 items.

---

### `GET /api/events`

Exports filtered events to a downloadable CSV file formatted with Western Indonesia Time (WIB).

- **URL**: `/api/events`
- **Method**: `GET`
- **Auth**: Active session cookie (if dashboard login enabled).

#### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `date` | `string` | Today (`YYYY-MM-DD`) | Filter events for a given calendar day (WIB). |
| `useCase` | `string` | `undefined` | Filter by use case (e.g. `vehicle_gate`). |
| `eventType` | `string` | `undefined` | Filter by specific event type. Note: heartbeat events (`status`) are excluded unless `eventType=status` is specified. |
| `cameraId` | `string` | `undefined` | Filter by camera ID. |

#### Response
- `Content-Type`: `text/csv; charset=utf-8`
- `Content-Disposition`: `attachment; filename="events-2026-10-02-vehicle_gate.csv"`

---

### `GET /api/ai/health`

Proxies the AI engine's health endpoint to check status and connected cameras.

- **URL**: `/api/ai/health`
- **Method**: `GET`
- **Upstream**: `${AI_ENGINE_URL}/health`
- **Response**:
  ```json
  {
    "cameras": [
      {
        "id": "cam-gate-01",
        "name": "Main Gate",
        "useCase": "vehicle_gate",
        "fps": 15.0,
        "online": true
      }
    ]
  }
  ```

---

### `GET /api/ai/frame/:cameraId`

Retrieves a single live annotated JPEG frame from the active pipeline memory.

- **URL**: `/api/ai/frame/{cameraId}?t={timestamp}`
- **Method**: `GET`
- **Upstream**: `${AI_ENGINE_URL}/frame/{cameraId}`
- **Response**: `image/jpeg`

---

### `GET /api/ai/stream/:cameraId`

Streams real-time MJPEG video with overlay bounding boxes and detection counts.

- **URL**: `/api/ai/stream/{cameraId}`
- **Method**: `GET`
- **Upstream**: `${AI_ENGINE_URL}/stream/{cameraId}`
- **Response**: `multipart/x-mixed-replace; boundary=frame`

---

### `GET /api/ai/snapshots/:path`

Fetches high-resolution event snapshot images saved on the AI engine host.

- **URL**: `/api/ai/snapshots/{path}`
- **Method**: `GET`
- **Upstream**: `${AI_ENGINE_URL}/snapshots/{path}`
- **Response**: `image/jpeg`

---

### `GET /api/clip`

Streams a **30-second recorded MP4 video excerpt** from the MediaMTX playback server around the exact time of an event.

- **URL**: `/api/clip`
- **Method**: `GET`
- **Auth**: Active session cookie (when dashboard login is enabled)
- **Time Calculation**:
  - `start`: 15 seconds before event (`new Date(ts - 15000).toISOString()`)
  - `duration`: `30` seconds (ends 15 seconds after event)
- **Upstream Call**:
  ```http
  GET ${MEDIAMTX_PLAYBACK_URL}/get?path={path}&start={isoStart}&duration=30&format=mp4
  ```

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `path` | `string` | Yes | Path of the camera stream in MediaMTX (alphanumeric, `/`, `-`, `_`). | `cam-gate-in` |
| `ts` | `number` | Yes | Event epoch timestamp in milliseconds. | `1727870400000` |

#### Response & Caching
- **`200 OK`**: Returns `video/mp4` stream directly.
  - **Past events** (where `ts + 15s < Date.now()`): Returns `Cache-Control: private, max-age=3600` so browsers cache completed clips.
  - **Ongoing/recent events** (where the 15s window is still recording): Returns `Cache-Control: no-store` so incomplete clips are not permanently cached.
- **`400 Bad Request`**: Missing, non-numeric `ts`, or invalid `path` format.
- **`404 Not Found`**: `MEDIAMTX_PLAYBACK_URL` not set in `.env.local`, or no recording segment exists for the given time.
- **`502 Bad Gateway`**: MediaMTX playback server is offline or unreachable.

#### Example Usage
```bash
# Direct fetch with curl
curl -O "http://localhost:3000/api/clip?path=cam-gate-in&ts=1727870400000"
```

```html
<!-- HTML5 Video Player inside dashboard modals -->
<video controls autoplay muted playsinline src="/api/clip?path=cam-gate-in&ts=1727870400000"></video>
```


---

### `GET /logout`

Signs out the current user session by clearing the `zoo_session` cookie and redirecting to `/login`.

- **URL**: `/logout`
- **Method**: `GET`
- **Response**: `307 Temporary Redirect` -> `/login`

---

## 4. Event Schemas & Use Cases

### 1. `vehicle_gate`
* **Event Types**: `vehicle_entry`, `vehicle_exit`
* **Severity**: `info`
* **`data` Payload**:
  ```json
  {
    "vehicleType": "CAR",
    "direction": "IN",
    "trackerId": 12,
    "snapshot": "gate/gate_in_12.jpg",
    "recordingPath": "cam-gate-in"
  }
  ```

### 2. `cashier_presence`
* **Event Types**:
  - `cashier_unattended`: Clerk missing from desk (`warning`).
  - `customer_waiting`: Visitor waiting while desk is empty (`critical`).
* **`data` Payload**:
  ```json
  {
    "deskId": "desk-1",
    "deskName": "Plaza Ticket Desk 1",
    "unattendedSec": 120,
    "waitingSec": 45,
    "visitorCount": 2,
    "snapshot": "cashier/desk1_alert.jpg",
    "recordingPath": "cam-cashier-01"
  }
  ```

### 3. `restaurant_counter`
* **Event Types**: `capacity_alert`
* **Severity**: `warning` (near limit) or `critical` (full)
* **`data` Payload**:
  ```json
  {
    "occupancy": 82,
    "maxCapacity": 90,
    "warningCapacity": 75,
    "level": "near_limit",
    "snapshot": "resto/cap_alert.jpg",
    "recordingPath": "cam-resto-01"
  }
  ```

### 4. `restaurant_table`
* **Event Types**: `table_state_change`
* **Severity**: `info`
* **`data` Payload**:
  ```json
  {
    "tableId": "T-04",
    "tableName": "Table 04",
    "oldStatus": "EMPTY",
    "status": "OCCUPIED",
    "dwellSec": 3200,
    "personCount": 4,
    "snapshot": "resto/t4_occupied.jpg",
    "recordingPath": "cam-resto-tables"
  }
  ```

### 5. `horse_riding`
* **Event Types**: `horse_crossing`
* **Severity**: `info`
* **`data` Payload**:
  ```json
  {
    "direction": "DEPARTURE",
    "trackerId": 7,
    "snapshot": "horse/ride_7.jpg",
    "recordingPath": "cam-horse-01"
  }
  ```

### 6. `status` (Heartbeat, every 30s)
* **Event Types**: `status`
* **Severity**: `info`
* **`data` Payload**: Contains real-time counters and camera health for dashboard live badges.

---

## 5. Code Examples

### cURL (Batch Ingestion)
```bash
curl -X POST "http://localhost:3000/api/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret-ingest-key" \
  -d '{
    "events": [
      {
        "eventId": "test-alert-001",
        "cameraId": "cam-cashier-1",
        "cameraName": "Loket Utama",
        "useCase": "cashier_presence",
        "eventType": "customer_waiting",
        "severity": "critical",
        "timestampMs": 1727870400000,
        "data": {
          "deskId": "desk-1",
          "waitingSec": 45,
          "snapshot": "cashier/desk1.jpg",
          "recordingPath": "cam-cashier-1"
        }
      }
    ]
  }'
```

### Python (`requests`)
```python
import time
import requests

API_URL = "http://127.0.0.1:3000/api/events"
INGEST_KEY = "secret-ingest-key"

def dispatch_event():
    now_ms = int(time.time() * 1000)
    payload = {
        "events": [
            {
                "eventId": f"gate_{now_ms}",
                "cameraId": "cam-gate-01",
                "cameraName": "Pintu Masuk Barat",
                "useCase": "vehicle_gate",
                "eventType": "vehicle_entry",
                "severity": "info",
                "timestampMs": now_ms,
                "data": {
                    "vehicleType": "CAR",
                    "direction": "IN",
                    "trackerId": 102
                }
            }
        ]
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {INGEST_KEY}"
    }
    resp = requests.post(API_URL, json=payload, headers=headers, timeout=5)
    resp.raise_for_status()
    print("Response:", resp.json())

if __name__ == "__main__":
    dispatch_event()
```
