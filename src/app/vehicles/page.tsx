import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { listEvents } from "@/lib/db";
import { byHour, dateParam, dayRange, fmtNum, fmtTime, operatingHours, pct, str, todayWib } from "@/lib/util";
import { Badge, Card, CsvLink, Mono, Note, PageHeader, Table, Tile, Tiles } from "@/components/ui";
import { HourlyBars } from "@/components/client";

export default async function Vehicles(props: PageProps<"/vehicles">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const q = str(sp.q).trim();
  const [from, to] = dayRange(date);
  const evs = await listEvents({ from, to, useCase: "vehicle_gate", eventType: "vehicle_crossing" });

  const entries = evs.filter((e) => e.data.direction === "ENTRY");
  const read = evs.filter((e) => e.data.plate && e.data.plate !== "UNIDENTIFIED");
  const valid = read.filter((e) => e.data.plateValid);

  const hourly = operatingHours(
    byHour(evs, { entries: (e) => +(e.data.direction === "ENTRY"), exits: (e) => +(e.data.direction === "EXIT") }),
    (r) => !r.entries && !r.exits,
  );

  const types = Object.entries(
    evs.reduce<Record<string, { in: number; out: number }>>((acc, e) => {
      const t = (acc[e.data.vehicleType] ??= { in: 0, out: 0 });
      if (e.data.direction === "ENTRY") t.in++;
      else t.out++;
      return acc;
    }, {}),
  ).sort((a, b) => b[1].in + b[1].out - (a[1].in + a[1].out));

  const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
  const matches = q ? evs.filter((e) => norm(String(e.data.plate)).includes(norm(q))) : evs;

  return (
    <>
      <PageHeader
        title="Vehicle gate"
        subtitle="Entries and exits counted at the gate tripwire, with plate reading (ANPR)"
        date={date}
      >
        <CsvLink href={`/api/events?date=${date}&useCase=vehicle_gate&eventType=vehicle_crossing`} />
      </PageHeader>

      <Tiles>
        <Tile label="Entries" value={fmtNum(entries.length)} icon={<ArrowDownLeft aria-hidden className="size-4 text-s1" />} />
        <Tile
          label="Exits"
          value={fmtNum(evs.length - entries.length)}
          icon={<ArrowUpRight aria-hidden className="size-4 text-s2" />}
        />
        <Tile
          label="Plates read"
          value={pct(read.length, evs.length)}
          sub={`${fmtNum(read.length)} of ${fmtNum(evs.length)} crossings`}
        />
        <Tile
          label="Valid Indonesian format"
          value={pct(valid.length, read.length)}
          sub={`${fmtNum(valid.length)} of ${fmtNum(read.length)} plates read`}
        />
      </Tiles>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Crossings per hour" className="lg:col-span-2">
          <HourlyBars
            data={hourly}
            series={[
              { key: "entries", label: "Entries" },
              { key: "exits", label: "Exits" },
            ]}
          />
        </Card>
        <Card title="By vehicle type">
          <Table
            head={["Type", "In", "Out", "Share"]}
            align={["left", "right", "right", "right"]}
            rows={types.map(([t, c]) => [
              <span key="t" className="capitalize">
                {t}
              </span>,
              fmtNum(c.in),
              fmtNum(c.out),
              pct(c.in + c.out, evs.length),
            ])}
            empty="No vehicles on this day."
          />
        </Card>
      </div>

      <Card
        title="Plate log"
        subtitle={`${q ? `${fmtNum(matches.length)} matching “${q}” · ` : ""}newest first${matches.length > 200 ? ", showing 200" : ""}`}
        actions={
          <form className="flex items-center gap-1.5" role="search">
            {date !== todayWib() && <input type="hidden" name="date" value={date} />}
            <label className="relative">
              <span className="sr-only">Search plate</span>
              <Search aria-hidden className="pointer-events-none absolute top-2 left-2 size-4 text-muted" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search plate, e.g. B 1234"
                className="h-8 w-56 rounded-md border border-line bg-surface pr-2 pl-8 text-sm text-ink placeholder:text-muted"
              />
            </label>
          </form>
        }
      >
        <Table
          head={["Time", "Plate", "Type", "Direction", "OCR confidence", "Format"]}
          align={["left", "left", "left", "left", "right", "left"]}
          rows={matches.slice(0, 200).map((e) => [
            fmtTime(e.ts),
            <Mono key="p">{e.data.plate}</Mono>,
            <span key="t" className="capitalize">
              {e.data.vehicleType}
            </span>,
            e.data.direction === "ENTRY" ? "↙ Entry" : "↗ Exit",
            e.data.plate === "UNIDENTIFIED" ? "—" : pct(Number(e.data.ocrConfidence) || 0, 1),
            e.data.plate === "UNIDENTIFIED" ? (
              <Badge key="v" tone="off">
                Not read
              </Badge>
            ) : e.data.plateValid ? (
              <Badge key="v" tone="good">
                Valid
              </Badge>
            ) : (
              <Badge key="v" tone="warn">
                Check
              </Badge>
            ),
          ])}
          empty={q ? `No plate matching “${q}” on ${date}.` : `No vehicles on ${date}.`}
        />
        <Note>
          “Valid” means the text matches the Indonesian plate format (e.g. B 1234 ABC). “Check” plates were read but may be OCR
          errors.
        </Note>
      </Card>
    </>
  );
}
