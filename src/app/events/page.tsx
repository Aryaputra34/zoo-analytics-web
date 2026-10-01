import { latestStatus, listEvents } from "@/lib/db";
import { EVENT_TYPES, USE_CASES, dateParam, dayRange, describe, fmtNum, fmtTime, str, todayWib } from "@/lib/util";
import { Card, CsvLink, PageHeader, SeverityBadge, Table } from "@/components/ui";

const select = "h-8 rounded-md border border-line bg-surface px-2 text-sm text-ink";

export default async function Events(props: PageProps<"/events">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const useCase = str(sp.useCase);
  const eventType = str(sp.eventType);
  const cameraId = str(sp.cameraId);
  const [from, to] = dayRange(date);
  const [evs, statuses] = await Promise.all([
    listEvents({ from, to, useCase, eventType, cameraId, excludeStatus: !eventType }),
    latestStatus(),
  ]);

  const cameras = new Map(statuses.map((s) => [s.cameraId, s.cameraName]));
  for (const e of evs) cameras.set(e.cameraId, e.cameraName);
  const qs = new URLSearchParams(Object.entries({ date, useCase, eventType, cameraId }).filter(([, v]) => v)).toString();

  return (
    <>
      <PageHeader title="Event log" subtitle="Every event received from the camera system" date={date}>
        <CsvLink href={`/api/events?${qs}`} />
      </PageHeader>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        {date !== todayWib() && <input type="hidden" name="date" value={date} />}
        <select name="useCase" defaultValue={useCase} aria-label="Use case" className={select}>
          <option value="">All use cases</option>
          {Object.entries(USE_CASES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="eventType" defaultValue={eventType} aria-label="Event type" className={select}>
          <option value="">All events (no heartbeats)</option>
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="cameraId" defaultValue={cameraId} aria-label="Camera" className={select}>
          <option value="">All cameras</option>
          {[...cameras].map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 cursor-pointer rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
        >
          Apply
        </button>
      </form>

      <Card
        title={`${fmtNum(evs.length)} events`}
        subtitle={evs.length > 500 ? "Newest 500 shown · export CSV for all" : "Newest first"}
      >
        <Table
          head={["Time", "Camera", "Use case", "Event", "Severity", "Details"]}
          rows={evs.slice(0, 500).map((e) => [
            fmtTime(e.ts),
            e.cameraName,
            USE_CASES[e.useCase] ?? e.useCase,
            EVENT_TYPES[e.eventType] ?? e.eventType,
            <SeverityBadge key="s" severity={e.severity} />,
            <span key="d" className="text-ink-2">
              {describe(e)}
            </span>,
          ])}
          empty={`No events match on ${date}.`}
        />
      </Card>
    </>
  );
}
