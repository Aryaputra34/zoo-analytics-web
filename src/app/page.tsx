import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { latestStatus, listEvents, type Ev } from "@/lib/db";
import {
  USE_CASES,
  STATUS_SEC,
  dateParam,
  dayRange,
  dayOf,
  describe,
  fmtMin,
  fmtNum,
  fmtHm,
  fmtTime,
  isOnline,
  todayWib,
} from "@/lib/util";
import { Card, Empty, OnlineBadge, PageHeader, SeverityBadge, Table, Tile, Tiles } from "@/components/ui";

function liveLine(s: Ev) {
  const d = s.data;
  switch (s.useCase) {
    case "cashier_presence":
      return d.state;
    case "restaurant_counter":
      return `${d.occupancy} / ${d.maxCapacity} people inside`;
    case "vehicle_gate":
      return `${d.inCount} in · ${d.outCount} out since service start`;
    case "horse_riding":
      return `${d.activeHorses} ponies in view · ${d.departures ?? 0} departures since service start`;
    default:
      return describe(s);
  }
}

export default async function Overview(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const today = todayWib();
  const isToday = date === today;
  const [from, to] = dayRange(date);
  const [evs, statuses] = await Promise.all([listEvents({ from, to }), latestStatus()]);

  const count = (type: string, dir: string) => evs.filter((e) => e.eventType === type && e.data.direction === dir).length;
  const vIn = count("vehicle_crossing", "ENTRY");
  const vOut = count("vehicle_crossing", "EXIT");
  const dep = count("horse_crossing", "DEPARTURE");
  const ret = count("horse_crossing", "RETURN");

  const occ = evs.filter((e) => e.useCase === "restaurant_counter" && e.eventType === "status");
  const peak = occ.reduce<Ev | undefined>((p, e) => (!p || e.data.occupancy > p.data.occupancy ? e : p), undefined);
  const liveRest = statuses.find((s) => s.useCase === "restaurant_counter" && isOnline(s));

  const unattendedMin =
    (evs.filter((e) => e.useCase === "cashier_presence" && e.eventType === "status" && e.data.clerkPresent === false).length *
      STATUS_SEC) /
    60;
  const alerts = evs.filter((e) => e.severity !== "info");
  const critical = alerts.filter((e) => e.severity === "critical").length;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={isToday ? "Today so far · all times WIB" : `Daily summary for ${date} · all times WIB`}
        date={date}
      />

      <Tiles>
        <Tile
          label="Vehicles entered"
          value={fmtNum(vIn)}
          sub={`${fmtNum(vOut)} exited · ${fmtNum(Math.max(0, vIn - vOut))} still inside`}
        />
        <Tile label="Pony ride departures" value={fmtNum(dep)} sub={`${fmtNum(ret)} returned`} />
        {isToday && liveRest ? (
          <Tile
            label="Restaurant now"
            value={`${liveRest.data.occupancy}/${liveRest.data.maxCapacity}`}
            sub={peak ? `Peak today ${peak.data.occupancy} at ${fmtHm(peak.ts)}` : undefined}
          />
        ) : (
          <Tile
            label="Restaurant peak"
            value={peak ? fmtNum(peak.data.occupancy) : "—"}
            sub={peak ? `at ${fmtHm(peak.ts)} · capacity ${peak.data.maxCapacity}` : "No data"}
          />
        )}
        <Tile
          label="Cashier desk unattended"
          value={fmtMin(unattendedMin)}
          sub={`${fmtNum(alerts.length)} alerts · ${fmtNum(critical)} critical`}
        />
      </Tiles>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card title="Cameras" subtitle={`Online = heartbeat in the last ${(3 * STATUS_SEC) / 60} min`} className="xl:col-span-2">
          {statuses.length ? (
            <ul className="-my-3 divide-y divide-line">
              {statuses.map((s) => {
                const online = isOnline(s);
                return (
                  <li key={s.cameraId} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{s.cameraName}</div>
                      <div className="text-xs text-muted">{USE_CASES[s.useCase] ?? s.useCase}</div>
                      <div className={`mt-1 text-sm ${online ? "text-ink-2" : "text-muted"}`}>
                        {online ? liveLine(s) : `Last seen ${dayOf(s.ts) === today ? fmtTime(s.ts) : dayOf(s.ts)}`}
                      </div>
                    </div>
                    <OnlineBadge online={online} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>No camera has reported yet. Start zoo-monitor, or run npm run seed for demo data.</Empty>
          )}
        </Card>

        <Card
          title="Latest alerts"
          className="xl:col-span-3"
          actions={
            <Link
              href={`/events${isToday ? "" : `?date=${date}`}`}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              All events <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          <Table
            head={["Time", "Camera", "Alert", "Severity"]}
            rows={alerts
              .slice(0, 10)
              .map((e) => [fmtTime(e.ts), e.cameraName, describe(e), <SeverityBadge key="s" severity={e.severity} />])}
            empty={`No alerts on ${date}.`}
          />
        </Card>
      </div>
    </>
  );
}
