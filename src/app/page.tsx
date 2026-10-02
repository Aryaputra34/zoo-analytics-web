import Link from "next/link";
import { ArrowRight, Camera, Car, ChevronRight, Store, Ticket, Utensils } from "lucide-react";
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
import { Card, Empty, Evidence, OnlineBadge, PageHeader, SafariHeroBanner, SeverityBadge, Table, Tile, Tiles } from "@/components/ui";

function liveLine(s: Ev) {
  const d = s.data;
  switch (s.useCase) {
    case "cashier_presence":
      return d.state;
    case "restaurant_counter":
      return `${d.occupancy} / ${d.maxCapacity} orang di dalam dining area`;
    case "vehicle_gate":
      return `${d.inCount} masuk · ${d.outCount} keluar dari koridor safari`;
    case "horse_riding":
      return `${d.activeHorses} kuda dalam pantauan · ${d.departures ?? 0} keberangkatan hari ini`;
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
  const onlineCams = statuses.filter((s) => isOnline(s)).length;

  return (
    <>
      {/* Hero Banner with authentic Taman Safari Indonesia panorama */}
      <SafariHeroBanner
        date={date}
        onlineCams={onlineCams}
        totalEvents={evs.length}
        todayVehicles={Math.max(0, vIn - vOut)}
      />

      <PageHeader
        tag="Taman Safari Bogor · Pusat Kendali"
        title="Ringkasan Operasional AI"
        subtitle={isToday ? "Pemantauan real-time hari ini · Seluruh waktu WIB (UTC+7)" : `Arsip operasional harian ${date} · Seluruh waktu WIB`}
        date={date}
      />

      {/* KPI Tiles */}
      <Tiles>
        <Tile
          label="Kendaraan Masuk (Gate)"
          icon={<Car aria-hidden />}
          value={fmtNum(vIn)}
          sub={`${fmtNum(vOut)} keluar · ${fmtNum(Math.max(0, vIn - vOut))} sedang di area Safari`}
        />
        <Tile
          label="Wahana Tunggang Kuda"
          icon={<Ticket aria-hidden />}
          value={fmtNum(dep)}
          sub={`${fmtNum(ret)} kembali · ${fmtNum(Math.max(0, dep - ret))} sedang berkuda`}
        />
        {isToday && liveRest ? (
          <Tile
            label="Kapasitas Restoran"
            icon={<Utensils aria-hidden />}
            value={`${liveRest.data.occupancy}/${liveRest.data.maxCapacity}`}
            sub={peak ? `Puncak hari ini ${peak.data.occupancy} org (${fmtHm(peak.ts)})` : "Beban teratur"}
          />
        ) : (
          <Tile
            label="Puncak Restoran"
            icon={<Utensils aria-hidden />}
            value={peak ? fmtNum(peak.data.occupancy) : "—"}
            sub={peak ? `Pukul ${fmtHm(peak.ts)} · Kapasitas ${peak.data.maxCapacity}` : "Tidak ada data"}
          />
        )}
        <Tile
          label="Loket Tanpa Petugas"
          icon={<Store aria-hidden />}
          value={fmtMin(unattendedMin)}
          sub={`${fmtNum(alerts.length)} alert sistem · ${fmtNum(critical)} kritis`}
        />
      </Tiles>

      {/* Zone Quick Jump Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/vehicles"
          className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-lime hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime/20 text-forest">
              <Car className="size-4.5" />
            </span>
            <ChevronRight className="size-4 text-muted group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-muted">Area Gerbang</div>
            <div className="text-sm font-black text-forest">Safari Journey · Hitung Kendaraan</div>
          </div>
        </Link>

        <Link
          href="/cashier"
          className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-lime hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime/20 text-forest">
              <Store className="size-4.5" />
            </span>
            <ChevronRight className="size-4 text-muted group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-muted">Area Loket</div>
            <div className="text-sm font-black text-forest">Tiket & Mini Train</div>
          </div>
        </Link>

        <Link
          href="/restaurant"
          className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-lime hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime/20 text-forest">
              <Utensils className="size-4.5" />
            </span>
            <ChevronRight className="size-4 text-muted group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-muted">Area F&B</div>
            <div className="text-sm font-black text-forest">Safari Dining Hall</div>
          </div>
        </Link>

        <Link
          href="/rides"
          className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-lime hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime/20 text-forest">
              <Ticket className="size-4.5" />
            </span>
            <ChevronRight className="size-4 text-muted group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-muted">Area Rekreasi</div>
            <div className="text-sm font-black text-forest">Pony Rides Arena</div>
          </div>
        </Link>
      </div>

      {/* Main Grid: Live Camera Network & Alerts Stream */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Left: Camera List */}
        <Card
          title="Status Kamera AI Aktif"
          subtitle={`Jaringan sensor CCTV AI (Heartbeat setiap ${(STATUS_SEC)} detik)`}
          className="xl:col-span-2"
        >
          {statuses.length ? (
            <ul className="-my-3 divide-y divide-line/60">
              {statuses.map((s) => {
                const online = isOnline(s);
                return (
                  <li key={s.cameraId} className="flex items-start justify-between gap-3 py-4 transition-colors hover:bg-surface-2/30 px-2 rounded-xl">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        online ? "bg-lime/20 text-forest" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        <Camera className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-forest">{s.cameraName}</div>
                        <div className="text-xs font-bold text-muted">{USE_CASES[s.useCase] ?? s.useCase}</div>
                        <div className={`mt-1 text-xs font-semibold ${online ? "text-ink" : "text-muted"}`}>
                          {online ? liveLine(s) : `Terakhir aktif ${dayOf(s.ts) === today ? fmtTime(s.ts) : dayOf(s.ts)}`}
                        </div>
                      </div>
                    </div>
                    <OnlineBadge online={online} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Belum ada kamera yang mengirim laporan data. Silakan jalankan zoo-monitor atau npm run seed.</Empty>
          )}
        </Card>

        {/* Right: Alerts Feed */}
        <Card
          title="Peringatan Operasional & Keamanan"
          subtitle={`Deteksi otomatis kapasitas dan antrean pada ${date}`}
          className="xl:col-span-3"
          actions={
            <Link
              href={`/events${isToday ? "" : `?date=${date}`}`}
              className="inline-flex items-center gap-1 rounded-full bg-lime/20 px-3 py-1 text-xs font-extrabold text-forest hover:bg-lime/30 transition-colors"
            >
              Lihat Semua Event ({alerts.length}) <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          <Table
            head={["Waktu", "Kamera", "Deteksi / Kejadian", "Tingkat", "Bukti"]}
            rows={alerts
              .slice(0, 10)
              .map((e) => [
                fmtTime(e.ts),
                e.cameraName,
                describe(e),
                <SeverityBadge key="s" severity={e.severity} />,
                <Evidence key="v" e={e} />,
              ])}
            empty={`Tidak ada peringatan operasional pada ${date}. Seluruh sistem normal.`}
          />
        </Card>
      </div>
    </>
  );
}

