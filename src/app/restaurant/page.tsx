import { latestStatus, listEvents } from "@/lib/db";
import { STATUS_SEC, dateParam, dayRange, describe, fmtHm, fmtMin, fmtNum, fmtTime, isOnline, pct, todayWib } from "@/lib/util";
import { Card, Empty, OnlineBadge, PageHeader, SeverityBadge, Table, Tile } from "@/components/ui";
import { OccupancyChart } from "@/components/client";

const BUCKET = 5 * 60_000;

export default async function Restaurant(props: PageProps<"/restaurant">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const isToday = date === todayWib();
  const [from, to] = dayRange(date);
  const [evs, statuses] = await Promise.all([listEvents({ from, to, useCase: "restaurant_counter" }), latestStatus()]);

  const cams = new Map<string, string>();
  for (const e of [...statuses.filter((s) => s.useCase === "restaurant_counter"), ...evs]) cams.set(e.cameraId, e.cameraName);

  return (
    <>
      <PageHeader title="Restaurant" subtitle="People counted inside the dining area against its capacity" date={date} />

      {cams.size === 0 && (
        <Card>
          <Empty>No restaurant camera has reported on {date}.</Empty>
        </Card>
      )}

      {[...cams].map(([id, name]) => {
        const mine = evs.filter((e) => e.cameraId === id);
        const samples = mine.filter((e) => e.eventType === "status").reverse();
        const alerts = mine.filter((e) => e.eventType === "capacity_alert");
        const live = statuses.find((s) => s.cameraId === id);
        const online = isOnline(live);
        const ref = live ?? samples.at(-1);
        const warning = Number(ref?.data.warningCapacity) || 45;
        const max = Number(ref?.data.maxCapacity) || 60;
        const peak = samples.reduce((p, e) => (!p || e.data.occupancy > p.data.occupancy ? e : p), samples[0]);
        const busyMin = (samples.filter((e) => e.data.occupancy >= warning).length * STATUS_SEC) / 60;

        // 5-minute buckets, keeping the peak of each bucket.
        const buckets = new Map<number, number>();
        for (const e of samples) {
          const b = Math.floor(e.ts / BUCKET) * BUCKET;
          buckets.set(b, Math.max(buckets.get(b) ?? 0, Number(e.data.occupancy) || 0));
        }
        const chart = [...buckets].map(([t, occupancy]) => ({ time: fmtHm(t), occupancy }));

        return (
          <div key={id} className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">{name}</h2>
              <OnlineBadge online={online} />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile
                label="Inside now"
                value={isToday && online ? `${live!.data.occupancy}` : "—"}
                sub={isToday && online ? `${pct(live!.data.occupancy, max)} of capacity ${max}` : "Camera offline"}
              />
              <Tile
                label="Peak"
                value={peak ? fmtNum(peak.data.occupancy) : "—"}
                sub={peak ? `at ${fmtHm(peak.ts)}` : "No data"}
              />
              <Tile label={`Time at ${warning}+ people`} value={fmtMin(busyMin)} sub="Near or over capacity" />
              <Tile
                label="Capacity alerts"
                value={fmtNum(alerts.length)}
                sub={`${fmtNum(alerts.filter((a) => a.data.level === "full").length)} at full capacity`}
              />
            </div>
            <div className="grid gap-4">
              <Card title="Occupancy through the day" subtitle="Highest count in each 5-minute window">
                {chart.length ? (
                  <OccupancyChart data={chart} warning={warning} max={max} />
                ) : (
                  <Empty>No occupancy data on {date}.</Empty>
                )}
              </Card>
              <Card title="Capacity alerts" subtitle={alerts.length > 100 ? "Newest 100" : "Newest first"}>
                <Table
                  maxH="max-h-72"
                  head={["Time", "Alert", "Severity"]}
                  rows={alerts
                    .slice(0, 100)
                    .map((e) => [fmtTime(e.ts), describe(e), <SeverityBadge key="s" severity={e.severity} />])}
                  empty="No capacity alerts."
                />
              </Card>
            </div>
          </div>
        );
      })}
    </>
  );
}
