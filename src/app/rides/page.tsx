import Link from "next/link";
import { listEvents } from "@/lib/db";
import { byHour, dateParam, dayOf, dayRange, fmtNum, fmtTime, operatingHours, shiftDate, todayWib } from "@/lib/util";
import { Card, CsvLink, Mono, Note, PageHeader, Table, Tile, Tiles } from "@/components/ui";
import { HourlyBars } from "@/components/client";

export default async function Rides(props: PageProps<"/rides">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const isToday = date === todayWib();
  const [from, to] = dayRange(date);
  const [from14] = dayRange(shiftDate(date, -13));
  const all = await listEvents({ from: from14, to, useCase: "horse_riding", eventType: "horse_crossing" });

  const evs = all.filter((e) => e.ts >= from);
  const dep = evs.filter((e) => e.data.direction === "DEPARTURE").length;
  const ret = evs.length - dep;
  const hourlyAll = byHour(evs, {
    departures: (e) => +(e.data.direction === "DEPARTURE"),
    returns: (e) => +(e.data.direction === "RETURN"),
  });
  const busiest = hourlyAll.reduce((b, r) => (r.departures > b.departures ? r : b), hourlyAll[0]);
  const hourly = operatingHours(hourlyAll, (r) => !r.departures && !r.returns);

  const days = Array.from({ length: 14 }, (_, i) => shiftDate(date, -i)).map((d) => {
    const mine = all.filter((e) => dayOf(e.ts) === d);
    const dd = mine.filter((e) => e.data.direction === "DEPARTURE").length;
    return { d, dep: dd, ret: mine.length - dd };
  });

  return (
    <>
      <PageHeader
        title="Pony rides"
        subtitle="Every pony crossing the departure line is counted, for checking against ticket sales"
        date={date}
      >
        <CsvLink href={`/api/events?date=${date}&useCase=horse_riding&eventType=horse_crossing`} />
      </PageHeader>

      <Tiles>
        <Tile label="Ride departures" value={fmtNum(dep)} sub="Compare with POS tickets sold" />
        <Tile label="Returns" value={fmtNum(ret)} />
        <Tile
          label={isToday ? "Out on a ride now" : "Not seen returning"}
          value={fmtNum(Math.max(0, dep - ret))}
          sub={isToday ? "Departures minus returns" : "Departures minus returns at end of day"}
        />
        <Tile
          label="Busiest hour"
          value={busiest.departures ? `${busiest.hour}:00` : "—"}
          sub={busiest.departures ? `${busiest.departures} departures` : "No rides"}
        />
      </Tiles>

      <div className="mb-4 grid items-start gap-4 lg:grid-cols-3">
        <Card title="Rides per hour" className="lg:col-span-2">
          <HourlyBars
            data={hourly}
            series={[
              { key: "departures", label: "Departures" },
              { key: "returns", label: "Returns" },
            ]}
          />
        </Card>
        <Card title="Last 14 days" subtitle="Daily totals for POS reconciliation">
          <Table
            maxH="max-h-64"
            head={["Date", "Departures", "Returns"]}
            align={["left", "right", "right"]}
            rows={days.map((r) => [
              <Link
                key="d"
                href={r.d === todayWib() ? "/rides" : `/rides?date=${r.d}`}
                className={`hover:underline ${r.d === date ? "font-semibold text-accent" : ""}`}
              >
                {r.d}
              </Link>,
              fmtNum(r.dep),
              fmtNum(r.ret),
            ])}
          />
        </Card>
      </div>

      <Card title="Crossing log" subtitle={evs.length > 200 ? "Newest 200" : "Newest first"}>
        <Table
          head={["Time", "Direction", "Camera", "Track #"]}
          rows={evs
            .slice(0, 200)
            .map((e) => [
              fmtTime(e.ts),
              e.data.direction === "DEPARTURE" ? "↗ Departure" : "↙ Return",
              e.cameraName,
              <Mono key="t">{e.data.trackerId ?? "—"}</Mono>,
            ])}
          empty={`No pony crossings on ${date}.`}
        />
        <Note>
          Counts come from line crossings, not from unique tracked objects (one pony can get several track numbers). The track #
          only helps find the matching clip in Nx Witness.
        </Note>
      </Card>
    </>
  );
}
