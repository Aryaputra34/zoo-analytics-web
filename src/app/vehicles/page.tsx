import Link from "next/link";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bike,
  Bus,
  Car,
  Clock,
  Filter,
  Layers,
  LogIn,
  LogOut,
  Radio,
  SlidersHorizontal,
  TrendingUp,
  Truck,
} from "lucide-react";
import { listEvents } from "@/lib/db";
import { byHour, dateParam, dayRange, fmtNum, fmtTime, operatingHours, pct, str, todayWib } from "@/lib/util";
import { Badge, Card, CsvLink, Evidence, Mono, Note, PageHeader, ProgressBar, Table, Tile, Tiles } from "@/components/ui";
import { HourlyBars } from "@/components/client";

function getVehicleMeta(type: string) {
  const t = (type || "").toLowerCase();
  switch (t) {
    case "car":
      return {
        label: "Mobil Pribadi",
        en: "Passenger Car",
        Icon: Car,
        badgeCls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
        progressColor: "bg-emerald-500",
      };
    case "bus":
      return {
        label: "Bus Safari / Rombongan",
        en: "Tour Bus",
        Icon: Bus,
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        progressColor: "bg-amber-500",
      };
    case "motorcycle":
      return {
        label: "Sepeda Motor",
        en: "Motorcycle",
        Icon: Bike,
        badgeCls: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
        progressColor: "bg-sky-500",
      };
    case "truck":
      return {
        label: "Truk / Kendaraan Operasional",
        en: "Service Truck",
        Icon: Truck,
        badgeCls: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
        progressColor: "bg-purple-500",
      };
    default:
      return {
        label: type || "Lainnya",
        en: "Vehicle",
        Icon: Car,
        badgeCls: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
        progressColor: "bg-lime",
      };
  }
}

export default async function Vehicles(props: PageProps<"/vehicles">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const dirFilter = str(sp.dir).toUpperCase();
  const typeFilter = str(sp.type).toLowerCase();

  const [from, to] = dayRange(date);
  const evs = await listEvents({ from, to, useCase: "vehicle_gate", eventType: "vehicle_crossing" });

  const entries = evs.filter((e) => e.data.direction === "ENTRY");
  const exits = evs.filter((e) => e.data.direction === "EXIT");
  const netInCorridor = Math.max(0, entries.length - exits.length);

  // Hourly traffic breakdown
  const hourlyAll = byHour(evs, {
    entries: (e) => +(e.data.direction === "ENTRY"),
    exits: (e) => +(e.data.direction === "EXIT"),
  });
  const hourly = operatingHours(hourlyAll, (r) => !r.entries && !r.exits);

  // Peak traffic analysis
  const peakHour = hourlyAll.reduce(
    (max, h) => (h.entries + h.exits > max.entries + max.exits ? h : max),
    hourlyAll[0] ?? { hour: "08", entries: 0, exits: 0 },
  );
  const peakHourTotal = (peakHour?.entries ?? 0) + (peakHour?.exits ?? 0);

  // Vehicle classification counts
  const typesMap = evs.reduce<Record<string, { in: number; out: number }>>((acc, e) => {
    const t = e.data.vehicleType || "other";
    const cur = (acc[t] ??= { in: 0, out: 0 });
    if (e.data.direction === "ENTRY") cur.in++;
    else cur.out++;
    return acc;
  }, {});

  const types = Object.entries(typesMap).sort((a, b) => b[1].in + b[1].out - (a[1].in + a[1].out));

  // Density assessment
  let densityLabel = "Lancar";
  let densityTone: "good" | "info" | "warn" = "good";
  if (netInCorridor >= 220) {
    densityLabel = "Padat";
    densityTone = "warn";
  } else if (netInCorridor >= 90) {
    densityLabel = "Ramai Normal";
    densityTone = "info";
  }

  // Filter crossings for the telemetry stream table
  const filteredEvs = evs.filter((e) => {
    if (dirFilter && dirFilter !== "ALL" && e.data.direction !== dirFilter) return false;
    if (typeFilter && typeFilter !== "ALL" && (e.data.vehicleType || "").toLowerCase() !== typeFilter) return false;
    return true;
  });

  const makeFilterUrl = (newDir?: string, newType?: string) => {
    const params = new URLSearchParams();
    if (date !== todayWib()) params.set("date", date);
    const d = newDir !== undefined ? newDir : dirFilter;
    const t = newType !== undefined ? newType : typeFilter;
    if (d && d !== "ALL") params.set("dir", d);
    if (t && t !== "ALL") params.set("type", t);
    const qs = params.toString();
    return qs ? `/vehicles?${qs}` : "/vehicles";
  };

  return (
    <>
      <PageHeader
        tag="Taman Safari Bogor · Gerbang Masuk & Keluar Utama"
        title="Safari Journey · Arus Lalu Lintas & Penghitungan Kendaraan"
        subtitle="Pemantauan real-time volume lintasan kendaraan masuk & keluar, estimasi beban koridor satwa liar, dan klasifikasi jenis moda transportasi AI"
        date={date}
      >
        <CsvLink href={`/api/events?date=${date}&useCase=vehicle_gate&eventType=vehicle_crossing`} />
      </PageHeader>

      {/* 4 High-Impact Operational KPI Tiles */}
      <Tiles>
        <Tile
          label="Total Kendaraan Masuk"
          value={fmtNum(entries.length)}
          icon={<LogIn aria-hidden />}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
              <ArrowDownLeft className="size-3" /> Inflow
            </span>
          }
          sub={`${pct(entries.length, evs.length)} dari total lintasan hari ini`}
        />

        <Tile
          label="Total Kendaraan Keluar"
          value={fmtNum(exits.length)}
          icon={<LogOut aria-hidden />}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 text-[10px] font-black text-sky-800 dark:text-sky-300">
              <ArrowUpRight className="size-3" /> Outflow
            </span>
          }
          sub="Menuju area rekreasi & parkir luar"
        />

        <Tile
          label="Kendaraan di Koridor Safari"
          value={fmtNum(netInCorridor)}
          icon={<Car aria-hidden />}
          badge={<Badge tone={densityTone}>{densityLabel}</Badge>}
          sub={`Selisih masuk (${fmtNum(entries.length)}) dikurangi keluar (${fmtNum(exits.length)})`}
        />

        <Tile
          label="Puncak Arus Kendaraan"
          value={peakHourTotal > 0 ? `${peakHour.hour}:00 WIB` : "—"}
          icon={<TrendingUp aria-hidden />}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
              <Clock className="size-3" /> Peak
            </span>
          }
          sub={peakHourTotal > 0 ? `${fmtNum(peakHourTotal)} lintasan per jam (Tertinggi)` : "Belum ada pergerakan"}
        />
      </Tiles>

      {/* Traffic Flow Hourly Chart + Fleet Classification */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Left: Hourly Bar Chart */}
        <Card
          title="Distribusi Volume Kendaraan per Jam"
          subtitle="Perbandingan intensitas kendaraan masuk (inflow) vs keluar (outflow) di gerbang koridor"
          className="lg:col-span-2"
          actions={
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-forest" /> Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-lime" /> Keluar
              </span>
            </div>
          }
        >
          <HourlyBars
            data={hourly}
            series={[
              { key: "entries", label: "Kendaraan Masuk (Inbound)" },
              { key: "exits", label: "Kendaraan Keluar (Outbound)" },
            ]}
          />

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-line/60 pt-4">
            <div className="rounded-xl bg-surface-2/60 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Total Lintasan</div>
              <div className="mt-0.5 text-lg font-black text-forest">{fmtNum(evs.length)}</div>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Turnover Ratio</div>
              <div className="mt-0.5 text-lg font-black text-forest">
                {entries.length > 0 ? `${Math.round((exits.length / entries.length) * 100)}%` : "0%"}
              </div>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Rata-Rata Masuk/Jam</div>
              <div className="mt-0.5 text-lg font-black text-forest">
                {hourly.length > 0 ? Math.round(entries.length / hourly.length) : 0} <span className="text-xs font-normal text-muted">unit</span>
              </div>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Jam Operasional</div>
              <div className="mt-0.5 text-lg font-black text-forest">08:30 – 17:00</div>
            </div>
          </div>
        </Card>

        {/* Right: Fleet / Vehicle Classification Breakdown */}
        <Card
          title="Klasifikasi Jenis Armada"
          subtitle="Komposisi tipe kendaraan pengunjung yang melintasi koridor"
        >
          {types.length > 0 ? (
            <div className="space-y-4">
              {types.map(([t, count]) => {
                const meta = getVehicleMeta(t);
                const Icon = meta.Icon;
                const total = count.in + count.out;
                const sharePct = evs.length > 0 ? Math.round((total / evs.length) * 100) : 0;

                return (
                  <div key={t} className="rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 transition-all hover:bg-surface-2/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex size-8 items-center justify-center rounded-xl border ${meta.badgeCls}`}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-forest">{meta.label}</div>
                          <div className="text-[10px] font-semibold text-muted">{meta.en}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-forest">{fmtNum(total)} <span className="text-xs font-semibold text-muted">({sharePct}%)</span></div>
                        <div className="text-[10px] font-bold text-muted">
                          {fmtNum(count.in)} Masuk · {fmtNum(count.out)} Keluar
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar value={total} max={evs.length || 1} color={meta.progressColor} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-bold text-muted">
              Tidak ada data klasifikasi kendaraan pada {date}.
            </div>
          )}
        </Card>
      </div>

      {/* Vehicle Crossing Telemetry Stream (Log Lintasan Kendaraan) */}
      <Card
        title="Log Arus Lintasan Kendaraan Real-Time"
        subtitle={`${filteredEvs.length > 0 ? `Menampilkan ${fmtNum(Math.min(filteredEvs.length, 200))} lintasan kendaraan` : "Tidak ada catatan lintasan"} · Seluruh telemetri tercatat sensor CCTV AI`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Direction Filter Tabs */}
            <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5 text-xs font-bold">
              <Link
                href={makeFilterUrl("ALL")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  !dirFilter || dirFilter === "ALL"
                    ? "bg-forest text-lime shadow-sm font-black"
                    : "text-muted hover:text-forest"
                }`}
              >
                Semua Arah
              </Link>
              <Link
                href={makeFilterUrl("ENTRY")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  dirFilter === "ENTRY"
                    ? "bg-forest text-lime shadow-sm font-black"
                    : "text-muted hover:text-forest"
                }`}
              >
                Masuk
              </Link>
              <Link
                href={makeFilterUrl("EXIT")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  dirFilter === "EXIT"
                    ? "bg-forest text-lime shadow-sm font-black"
                    : "text-muted hover:text-forest"
                }`}
              >
                Keluar
              </Link>
            </div>

            {/* Type Filter Dropdown */}
            {types.length > 0 && (
              <form method="get" action="/vehicles" className="inline-flex items-center">
                {date !== todayWib() && <input type="hidden" name="date" value={date} />}
                {dirFilter && dirFilter !== "ALL" && <input type="hidden" name="dir" value={dirFilter} />}
                <select
                  name="type"
                  defaultValue={typeFilter || "ALL"}
                  // Auto-submit on change
                  className="h-8 rounded-full border border-line bg-surface px-3 text-xs font-bold text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-lime"
                >
                  <option value="ALL">Semua Jenis Moda</option>
                  {types.map(([t]) => {
                    const meta = getVehicleMeta(t);
                    return (
                      <option key={t} value={t}>
                        {meta.label}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="submit"
                  className="ml-1.5 h-8 rounded-full bg-lime/20 px-3 text-xs font-bold text-forest hover:bg-lime/30 transition-colors"
                >
                  Filter
                </button>
              </form>
            )}
          </div>
        }
      >
        <Table
          head={["Waktu (WIB)", "Arah Lintasan", "Klasifikasi Kendaraan", "Kamera Sensor / Gerbang", "Status Sensor", "Ref Lintasan", "Bukti"]}
          align={["left", "left", "left", "left", "left", "right", "left"]}
          rows={filteredEvs.slice(0, 200).map((e) => {
            const meta = getVehicleMeta(e.data.vehicleType);
            const Icon = meta.Icon;
            const isEntry = e.data.direction === "ENTRY";

            return [
              <div key="t" className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${isEntry ? "bg-emerald-500" : "bg-sky-500"}`} />
                <span className="font-bold text-forest">{fmtTime(e.ts)}</span>
              </div>,

              isEntry ? (
                <span
                  key="d"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <ArrowDownLeft className="size-3.5" /> Masuk (Entry)
                </span>
              ) : (
                <span
                  key="d"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-black text-sky-800 dark:border-sky-800/40 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  <ArrowUpRight className="size-3.5" /> Keluar (Exit)
                </span>
              ),

              <div key="k" className="flex items-center gap-2">
                <span className={`flex size-6 items-center justify-center rounded-lg border ${meta.badgeCls}`}>
                  <Icon className="size-3.5" />
                </span>
                <span className="font-extrabold text-forest">{meta.label}</span>
              </div>,

              <span key="c" className="font-medium text-ink-2">
                {e.cameraName || "Main Vehicle Gate 1"}
              </span>,

              <span key="st" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Terverifikasi AI
              </span>,

              <Mono key="ref">
                #{e.data.trackerId ? `TRK-${e.data.trackerId}` : e.id.slice(-6).toUpperCase()}
              </Mono>,

              <Evidence key="v" e={e} />,
            ];
          })}
          empty={
            dirFilter || typeFilter
              ? "Tidak ada perlintasan kendaraan yang sesuai dengan kriteria filter."
              : `Belum ada kendaraan yang tercatat melintas pada ${date}.`
          }
        />

        <Note>
          Catatan: Penghitungan otomatis volume dan klasifikasi kendaraan menggunakan deteksi computer vision tripwire pada koridor gerbang masuk & keluar Taman Safari.
        </Note>
      </Card>
    </>
  );
}
