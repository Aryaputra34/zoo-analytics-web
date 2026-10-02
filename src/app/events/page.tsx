import { Filter } from "lucide-react";
import { latestStatus, listEvents } from "@/lib/db";
import { EVENT_TYPES, USE_CASES, dateParam, dayRange, describe, fmtNum, fmtTime, str, todayWib } from "@/lib/util";
import { Card, CsvLink, Evidence, PageHeader, SeverityBadge, Table } from "@/components/ui";

const select = "h-9 rounded-full border border-line bg-surface px-3 text-xs font-bold text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-lime";

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
      <PageHeader
        tag="Taman Safari Bogor · Audit & Keamanan"
        title="Log Kejadian & Peringatan AI"
        subtitle="Aliran data seluruh deteksi sensor computer vision, tripwire, dan notifikasi operasional taman"
        date={date}
      >
        <CsvLink href={`/api/events?${qs}`} />
      </PageHeader>

      <div className="mb-6 rounded-[22px] border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-forest">
          <Filter className="size-3.5 text-lime-dark dark:text-lime" />
          Filter Data Kejadian
        </div>
        <form className="flex flex-wrap items-center gap-2.5">
          {date !== todayWib() && <input type="hidden" name="date" value={date} />}
          <select name="useCase" defaultValue={useCase} aria-label="Zona / Use Case" className={select}>
            <option value="">Semua Zona Operasional</option>
            {Object.entries(USE_CASES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="eventType" defaultValue={eventType} aria-label="Tipe Event" className={select}>
            <option value="">Semua Event (Kecuali Heartbeat)</option>
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="cameraId" defaultValue={cameraId} aria-label="Kamera CCTV" className={select}>
            <option value="">Semua Kamera Sensor</option>
            {[...cameras].map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-full bg-forest text-lime px-5 text-xs font-black shadow-sm transition-all hover:bg-forest-dark hover:scale-[1.02]"
          >
            Terapkan Filter
          </button>
        </form>
      </div>

      <Card
        title={`Total ${fmtNum(evs.length)} Kejadian Terekam`}
        subtitle={evs.length > 500 ? "Menampilkan 500 kejadian terbaru · Unduh CSV untuk data lengkap" : "Diurutkan dari yang terbaru"}
      >
        <Table
          head={["Waktu (WIB)", "Kamera Sensor", "Zona / Use Case", "Tipe Kejadian", "Tingkat", "Detail Telemetri", "Bukti"]}
          rows={evs.slice(0, 500).map((e) => [
            fmtTime(e.ts),
            <span key="c" className="font-extrabold text-forest">{e.cameraName}</span>,
            USE_CASES[e.useCase] ?? e.useCase,
            EVENT_TYPES[e.eventType] ?? e.eventType,
            <SeverityBadge key="s" severity={e.severity} />,
            <span key="d" className="text-ink-2 font-medium">
              {describe(e)}
            </span>,
            <Evidence key="v" e={e} />,
          ])}
          empty={`Tidak ada kejadian yang cocok dengan filter pada ${date}.`}
        />
      </Card>
    </>
  );
}

