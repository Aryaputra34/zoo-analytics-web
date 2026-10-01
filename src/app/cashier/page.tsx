import { latestStatus, listEvents, type Ev } from "@/lib/db";
import {
  STATUS_SEC,
  byHour,
  dateParam,
  dayRange,
  describe,
  fmtMin,
  fmtNum,
  fmtTime,
  isOnline,
  operatingHours,
  todayWib,
} from "@/lib/util";
import { Badge, Card, Empty, Note, OnlineBadge, PageHeader, SeverityBadge, Table, Tile } from "@/components/ui";
import { HourlyBars } from "@/components/client";

const absent = (e: Ev) => e.eventType === "status" && e.data.clerkPresent === false;

function stateTone(state: string) {
  if (state.startsWith("ALERT")) return "crit" as const;
  if (state.includes("UNATTENDED")) return "warn" as const;
  return "good" as const;
}

export default async function Cashier(props: PageProps<"/cashier">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const isToday = date === todayWib();
  const [from, to] = dayRange(date);
  const [evs, statuses] = await Promise.all([listEvents({ from, to, useCase: "cashier_presence" }), latestStatus()]);

  const desks = new Map<string, string>();
  for (const e of [...statuses.filter((s) => s.useCase === "cashier_presence"), ...evs]) desks.set(e.cameraId, e.cameraName);
  const alerts = evs.filter((e) => e.eventType !== "status");
  const deskList = [...desks.entries()];

  const hourly = operatingHours(
    byHour(
      evs,
      Object.fromEntries(deskList.map(([id]) => [id, (e: Ev) => (e.cameraId === id && absent(e) ? STATUS_SEC / 60 : 0)])),
    ),
    (r) => deskList.every(([id]) => !r[id]),
  );

  return (
    <>
      <PageHeader
        title="Cashier desks"
        subtitle="Alerts when a desk is left unattended or a customer waits with no cashier"
        date={date}
      />

      {deskList.length === 0 && (
        <Card>
          <Empty>No cashier camera has reported on {date}.</Empty>
        </Card>
      )}

      {deskList.map(([id, name]) => {
        const mine = evs.filter((e) => e.cameraId === id);
        const status = statuses.find((s) => s.cameraId === id);
        const online = isOnline(status);
        const unattended = mine.filter((e) => e.eventType === "cashier_unattended");
        const waiting = mine.filter((e) => e.eventType === "customer_waiting");
        const longestAbsence = Math.max(0, ...unattended.map((e) => Number(e.data.absentSec) || 0));
        const longestWait = Math.max(0, ...waiting.map((e) => Number(e.data.waitingSec) || 0));
        return (
          <Card
            key={id}
            title={name}
            subtitle={id}
            className="mb-4"
            actions={
              <div className="flex items-center gap-2">
                {isToday && status && online && <Badge tone={stateTone(status.data.state)}>{status.data.state}</Badge>}
                <OnlineBadge online={online} />
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile
                label="Time unattended"
                value={fmtMin((mine.filter(absent).length * STATUS_SEC) / 60)}
                sub="Sampled every 30 s"
              />
              <Tile
                label="Unattended alerts"
                value={fmtNum(unattended.length)}
                sub={`Longest absence ${fmtMin(longestAbsence / 60)}`}
              />
              <Tile label="Customer waiting alerts" value={fmtNum(waiting.length)} sub={`Longest wait ${longestWait}s`} />
              <Tile
                label="Right now"
                value={isToday && online ? `${status!.data.clerkCount} / ${status!.data.visitorCount}` : "—"}
                sub={isToday && online ? "cashiers / customers at desk" : "Camera offline"}
              />
            </div>
          </Card>
        );
      })}

      {deskList.length > 0 && (
        <div className="grid gap-4">
          <Card title="Minutes unattended per hour">
            <HourlyBars data={hourly} series={deskList.map(([id, name]) => ({ key: id, label: name }))} unit=" min" />
          </Card>
          <Card title="Alert timeline" subtitle={alerts.length > 200 ? "Newest 200" : "Newest first"}>
            <Table
              maxH="max-h-96"
              head={["Time", "Desk", "Alert", "Severity"]}
              rows={alerts
                .slice(0, 200)
                .map((e) => [fmtTime(e.ts), e.cameraName, describe(e), <SeverityBadge key="s" severity={e.severity} />])}
              empty={`No alerts on ${date}.`}
            />
            <Note>An alert repeats every 30 s while the situation lasts, so one long absence produces several alerts.</Note>
          </Card>
        </div>
      )}
    </>
  );
}
