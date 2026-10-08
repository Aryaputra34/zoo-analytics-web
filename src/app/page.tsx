import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Camera,
  Car,
  ChevronRight,
  Clock,
  Sparkles,
  Store,
  Ticket,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import { latestStatus, listEvents, type Ev } from "@/lib/db";
import {
  EVENT_TYPES,
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
import { OverviewEventsTabs } from "@/components/OverviewEventsTabs";

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

  const opEvs = evs.filter((e) => e.eventType !== "status");
  const statusEvs = evs.filter((e) => e.eventType === "status");
  const opCount = opEvs.length;

  const seatedCount = evs.filter((e) => e.eventType === "table_state_change" && e.data.status === "OCCUPIED").length;
  const vacatedCount = evs.filter((e) => e.eventType === "table_state_change" && e.data.status === "VACATED").length;
  const capFullCount = evs.filter((e) => e.eventType === "capacity_alert" && e.data.level === "full").length;
  const capNearCount = evs.filter((e) => e.eventType === "capacity_alert" && e.data.level !== "full").length;

  type TypeSummary = {
    id: string;
    label: string;
    useCase: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    count: number;
    subDetail?: string;
  };

  const typeSummaries: TypeSummary[] = [
    {
      id: "vehicle_crossing",
      label: "Lintasan Kendaraan (Gate)",
      useCase: "Safari Journey",
      icon: Car,
      color: "bg-[#0d542e]",
      count: evs.filter((e) => e.eventType === "vehicle_crossing").length,
      subDetail: `${fmtNum(vIn)} masuk · ${fmtNum(vOut)} keluar`,
    },
    {
      id: "horse_crossing",
      label: "Wahana Tunggang Kuda",
      useCase: "Area Rekreasi",
      icon: Ticket,
      color: "bg-[#82bb3a]",
      count: evs.filter((e) => e.eventType === "horse_crossing").length,
      subDetail: `${fmtNum(dep)} berangkat · ${fmtNum(ret)} kembali`,
    },
    {
      id: "table_state_change",
      label: "Dinamika Meja Restoran",
      useCase: "Safari Dining",
      icon: Utensils,
      color: "bg-[#2080c4]",
      count: evs.filter((e) => e.eventType === "table_state_change").length,
      subDetail: `${fmtNum(seatedCount)} terisi · ${fmtNum(vacatedCount)} selesai`,
    },
    {
      id: "cashier_unattended",
      label: "Loket Tanpa Petugas",
      useCase: "Area Loket",
      icon: Store,
      color: "bg-[#f5a623]",
      count: evs.filter((e) => e.eventType === "cashier_unattended").length,
      subDetail: unattendedMin > 0 ? `Total kosong: ${fmtMin(unattendedMin)}` : "Peringatan loket tak terjaga",
    },
    {
      id: "customer_waiting",
      label: "Antrean Menunggu Kasir",
      useCase: "Area Loket",
      icon: Clock,
      color: "bg-[#ef4444]",
      count: evs.filter((e) => e.eventType === "customer_waiting").length,
      subDetail: "Pengunjung antre di loket kosong",
    },
    {
      id: "capacity_alert",
      label: "Batas Kapasitas Restoran",
      useCase: "Safari Dining",
      icon: TriangleAlert,
      color: "bg-[#a855f7]",
      count: evs.filter((e) => e.eventType === "capacity_alert").length,
      subDetail: capFullCount > 0 ? `${capFullCount} penuh · ${capNearCount} mendekati batas` : "Peringatan okupansi dining",
    },
  ];

  const standardIds = new Set(typeSummaries.map((t) => t.id).concat("status"));
  const extraTypes = [...new Set(opEvs.map((e) => e.eventType))].filter((t) => !standardIds.has(t));
  for (const tid of extraTypes) {
    typeSummaries.push({
      id: tid,
      label: EVENT_TYPES[tid] ?? tid,
      useCase: "Sensor AI",
      icon: Activity,
      color: "bg-zinc-500",
      count: evs.filter((e) => e.eventType === tid).length,
      subDetail: "Kejadian terdeteksi",
    });
  }

  const summaryContent = (
    <div className="space-y-6">
      {/* Top 3-Metric Highlight Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface-2/40 p-4 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Total Kejadian Operasional
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-forest">{fmtNum(opCount)}</span>
            <span className="text-xs font-semibold text-muted">kejadian riil</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-ink-2">
            Aktivitas gerbang, loket, resto, & wahana
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2/40 p-4 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Peringatan & Anomali
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${critical > 0 ? "text-crit" : alerts.length > 0 ? "text-warn" : "text-forest"}`}>
              {fmtNum(alerts.length)}
            </span>
            <span className="text-xs font-semibold text-muted">alert sistem</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-ink-2">
            {critical > 0 ? `${critical} penanganan kritis dibutuhkan` : "Kondisi batas dan antrean"}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2/40 p-4 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Telemetri Sensor Heartbeat
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-forest">{fmtNum(statusEvs.length)}</span>
            <span className="text-xs font-semibold text-muted">ping status</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-ink-2">
            {onlineCams} kamera aktif tiap 30 detik
          </div>
        </div>
      </div>

      {/* Distribution Proportion Bar */}
      {opCount > 0 && (
        <div className="rounded-2xl border border-line bg-surface-2/30 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-forest">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-lime" />
              Proporsi Distribusi Kejadian Operasional
            </span>
            <span className="text-muted font-bold">{fmtNum(opCount)} Kejadian</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2 p-0.5 border border-line/60">
            {typeSummaries
              .filter((t) => t.count > 0)
              .map((t) => {
                const pctVal = Math.max(1, Math.round((t.count / opCount) * 100));
                return (
                  <div
                    key={t.id}
                    className={`h-full first:rounded-l-full last:rounded-r-full ${t.color} transition-all duration-500`}
                    style={{ width: `${(t.count / opCount) * 100}%` }}
                    title={`${t.label}: ${t.count} (${pctVal}%)`}
                  />
                );
              })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-muted">
            {typeSummaries
              .filter((t) => t.count > 0)
              .map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${t.color}`} />
                  <span className="text-forest font-extrabold">{t.label}:</span>
                  <span>{Math.round((t.count / opCount) * 100)}%</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Event Types Table */}
      <div className="-mx-5 overflow-x-auto sm:-mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider font-extrabold text-forest">
              <th className="px-5 py-3 sm:px-6">Tipe Kejadian AI</th>
              <th className="px-5 py-3 sm:px-6">Zona / Use Case</th>
              <th className="px-5 py-3 sm:px-6 text-right">Jumlah</th>
              <th className="px-5 py-3 sm:px-6">Proporsi</th>
              <th className="px-5 py-3 sm:px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="tabular-nums divide-y divide-line/60">
            {typeSummaries.map((t) => {
              const Icon = t.icon;
              const pctVal = opCount > 0 ? Math.round((t.count / opCount) * 100) : 0;
              return (
                <tr key={t.id} className="transition-colors hover:bg-surface-2/40">
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-lime/20 text-forest">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-forest text-sm">{t.label}</div>
                        {t.subDetail && (
                          <div className="text-xs font-semibold text-muted">{t.subDetail}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 sm:px-6">
                    <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-ink-2 border border-line">
                      {t.useCase}
                    </span>
                  </td>
                  <td className="px-5 py-3 sm:px-6 text-right font-black text-forest">
                    {fmtNum(t.count)}
                  </td>
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2 border border-line/40">
                        <div
                          className={`h-full ${t.color}`}
                          style={{ width: `${Math.min(100, pctVal)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted min-w-8">{pctVal}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 sm:px-6 text-right">
                    <Link
                      href={`/events?eventType=${t.id}${isToday ? "" : `&date=${date}`}`}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-extrabold text-forest hover:border-lime hover:bg-lime/10 transition-colors shadow-xs"
                    >
                      Filter Log <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {/* Heartbeat Status row */}
            <tr className="bg-surface-2/20 transition-colors hover:bg-surface-2/40">
              <td className="px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-forest text-sm">Heartbeat & Telemetri Sensor</div>
                    <div className="text-xs font-semibold text-muted">
                      Ping periodik setiap 30 detik ({onlineCams} kamera online)
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 sm:px-6">
                <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted border border-line">
                  Sistem AI
                </span>
              </td>
              <td className="px-5 py-3 sm:px-6 text-right font-black text-muted">
                {fmtNum(statusEvs.length)}
              </td>
              <td className="px-5 py-3 sm:px-6">
                <span className="text-xs font-semibold text-muted">Telemetry</span>
              </td>
              <td className="px-5 py-3 sm:px-6 text-right">
                <Link
                  href={`/events?eventType=status${isToday ? "" : `&date=${date}`}`}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-extrabold text-forest hover:border-lime hover:bg-lime/10 transition-colors shadow-xs"
                >
                  Filter Log <ArrowRight className="size-3" />
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const alertsContent = (
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
  );

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

      {/* Main Grid: Live Camera Network & Overview Events Tabs */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Left: Camera List */}
        <Card
          title="Status Kamera AI Aktif"
          subtitle={`Jaringan sensor CCTV AI (Heartbeat setiap ${(STATUS_SEC)} detik)`}
          className="xl:col-span-2"
          actions={
            <Link
              href="/live"
              className="inline-flex items-center gap-1 rounded-full bg-lime/20 px-3 py-1 text-xs font-extrabold text-forest hover:bg-lime/30 transition-colors"
            >
              Buka Live Matrix <ArrowRight aria-hidden className="size-3" />
            </Link>
          }
        >
          {statuses.length ? (
            <ul className="-my-3 divide-y divide-line/60">
              {statuses.map((s) => {
                const online = isOnline(s);
                return (
                  <li key={s.cameraId}>
                    <Link
                      href="/live"
                      className="group flex items-start justify-between gap-3 py-3.5 transition-colors hover:bg-surface-2/40 px-2.5 rounded-xl block"
                      title="Lihat live stream kamera ini di /live"
                    >
                      <div className="min-w-0 flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                            online ? "bg-lime/20 text-forest" : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          <Camera className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-forest group-hover:text-forest-dark transition-colors">
                            {s.cameraName}
                          </div>
                          <div className="text-xs font-bold text-muted">
                            {USE_CASES[s.useCase] ?? s.useCase}
                          </div>
                          <div
                            className={`mt-1 text-xs font-semibold ${
                              online ? "text-ink" : "text-muted"
                            }`}
                          >
                            {online
                              ? liveLine(s)
                              : `Terakhir aktif ${dayOf(s.ts) === today ? fmtTime(s.ts) : dayOf(s.ts)}`}
                          </div>
                        </div>
                      </div>
                      <OnlineBadge online={online} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Belum ada kamera yang mengirim laporan data. Silakan jalankan zoo-monitor atau npm run seed.</Empty>
          )}
        </Card>

        {/* Right: Overview Events Tabs (Ringkasan Tipe Event & Peringatan) */}
        <OverviewEventsTabs
          alertsCount={alerts.length}
          criticalCount={critical}
          opCount={opCount}
          date={date}
          isToday={isToday}
          alertsContent={alertsContent}
          summaryContent={summaryContent}
        />
      </div>
    </>
  );
}

