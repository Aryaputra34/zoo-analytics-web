import { Armchair, BellRing, Clock, Hourglass, Repeat, TrendingUp, Users, Utensils } from "lucide-react";
import { latestStatus, listEvents, type Ev } from "@/lib/db";
import { STATUS_SEC, dateParam, dayRange, describe, fmtHm, fmtMin, fmtNum, fmtTime, isOnline, pct, todayWib } from "@/lib/util";
import { Card, Empty, Evidence, OnlineBadge, PageHeader, SeverityBadge, Table, Tile } from "@/components/ui";
import { OccupancyChart } from "@/components/client";

const BUCKET = 5 * 60_000;

export default async function Restaurant(props: PageProps<"/restaurant">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const isToday = date === todayWib();
  const [from, to] = dayRange(date);
  const [evs, tableEvs, statuses] = await Promise.all([
    listEvents({ from, to, useCase: "restaurant_counter" }),
    listEvents({ from, to, eventType: "table_state_change" }),
    latestStatus(),
  ]);

  const cams = new Map<string, string>();
  for (const e of [...statuses.filter((s) => s.useCase === "restaurant_counter"), ...evs]) cams.set(e.cameraId, e.cameraName);

  // Table monitoring: the restaurant_table pipeline, or restaurant_counter with tables enabled
  const tableCams = new Map<string, string>();
  for (const e of [...statuses.filter((s) => Array.isArray(s.data.tables)), ...tableEvs]) tableCams.set(e.cameraId, e.cameraName);

  return (
    <>
      <PageHeader
        tag="Taman Safari Bogor · Area Kuliner & Restoran"
        title="Safari Cafe & Rainforest Dining Hall"
        subtitle="Penghitungan AI okupansi pengunjung di dalam area santap terhadap batas aman (warning) dan batas kapasitas maksimum"
        date={date}
      />

      {cams.size === 0 && tableCams.size === 0 && (
        <Card>
          <Empty>Belum ada data kamera pemantau restoran pada {date}.</Empty>
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
          <div key={id} className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-lime/20 text-forest">
                  <Utensils className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-forest">{name}</h2>
                  <div className="text-xs text-muted">ID Sensor Kamera: {id}</div>
                </div>
              </div>
              <OnlineBadge online={online} />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <Tile
                label="Pengunjung Saat Ini"
                icon={<Users aria-hidden />}
                value={isToday && online ? `${live!.data.occupancy}` : "—"}
                sub={isToday && online ? `${pct(live!.data.occupancy, max)} dari kuota ${max} orang` : "Kamera offline"}
              />
              <Tile
                label="Beban Puncak Hari Ini"
                icon={<TrendingUp aria-hidden />}
                value={peak ? fmtNum(peak.data.occupancy) : "—"}
                sub={peak ? `Tercapai pukul ${fmtHm(peak.ts)} WIB` : "Tidak ada data"}
              />
              <Tile
                label={`Waktu di Atas ${warning} Orang`}
                icon={<Clock aria-hidden />}
                value={fmtMin(busyMin)}
                sub="Mendekati / melampaui batas warning"
              />
              <Tile
                label="Peringatan Kapasitas"
                icon={<BellRing aria-hidden />}
                value={fmtNum(alerts.length)}
                sub={`${fmtNum(alerts.filter((a) => a.data.level === "full").length)} kali mencapai kapasitas penuh`}
              />
            </div>

            <div className="grid gap-6">
              <Card
                title="Kurva Okupansi Pengunjung Sepanjang Hari"
                subtitle="Jumlah pengunjung tertinggi dalam setiap interval 5 menit"
              >
                {chart.length ? (
                  <OccupancyChart data={chart} warning={warning} max={max} />
                ) : (
                  <Empty>Tidak ada data okupansi pada {date}.</Empty>
                )}
              </Card>

              <Card
                title="Log Peringatan Kapasitas (Capacity Alerts)"
                subtitle={alerts.length > 100 ? "Menampilkan 100 peringatan terbaru" : "Diurutkan dari yang terbaru"}
              >
                <Table
                  maxH="max-h-72"
                  head={["Waktu", "Deskripsi Kejadian", "Tingkat Peringatan", "Bukti"]}
                  rows={alerts
                    .slice(0, 100)
                    .map((e) => [fmtTime(e.ts), describe(e), <SeverityBadge key="s" severity={e.severity} />, <Evidence key="v" e={e} />])}
                  empty="Tidak ada pelanggaran batas kapasitas pada hari ini. Kapasitas selalu aman."
                />
              </Card>
            </div>
          </div>
        );
      })}

      {[...tableCams].map(([id, name]) => (
        <TableSection
          key={`tables-${id}`}
          name={name}
          live={statuses.find((s) => s.cameraId === id)}
          changes={tableEvs.filter((e) => e.cameraId === id)}
          isToday={isToday}
        />
      ))}
    </>
  );
}

type TableState = { id: string; name: string; status: string; personCount: number; dwellSec: number };

function TableSection({ name, live, changes, isToday }: { name: string; live?: Ev; changes: Ev[]; isToday: boolean }) {
  const online = isToday && isOnline(live) && Array.isArray(live?.data.tables);
  const tables: TableState[] = online ? live!.data.tables : [];
  const seated = changes.filter((e) => e.data.status === "OCCUPIED").length;
  const stays = changes.filter((e) => e.data.status !== "OCCUPIED" && Number(e.data.dwellSec) > 0);
  const avgStayMin = stays.length ? stays.reduce((n, e) => n + Number(e.data.dwellSec), 0) / stays.length / 60 : 0;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-lime/20 text-forest">
            <Armchair className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-forest">Status Meja · {name}</h2>
            <div className="text-xs text-muted">Okupansi per meja dan lama tamu duduk</div>
          </div>
        </div>
        <OnlineBadge online={isOnline(live)} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Tile
          label="Meja Terisi Saat Ini"
          icon={<Armchair aria-hidden />}
          value={online ? `${live!.data.occupiedTables}/${live!.data.totalTables}` : "—"}
          sub={online ? `${live!.data.vacantTables} meja kosong` : "Kamera offline"}
        />
        <Tile
          label="Tingkat Okupansi Meja"
          icon={<TrendingUp aria-hidden />}
          value={online ? `${Math.round(Number(live!.data.occupancyRatePct) || 0)}%` : "—"}
          sub="Persentase meja terisi saat ini"
        />
        <Tile label="Tamu Duduk Hari Ini" icon={<Repeat aria-hidden />} value={fmtNum(seated)} sub="Jumlah meja mulai terisi" />
        <Tile
          label="Rata-rata Lama Duduk"
          icon={<Hourglass aria-hidden />}
          value={stays.length ? fmtMin(avgStayMin) : "—"}
          sub={`Dari ${fmtNum(stays.length)} meja yang sudah ditinggalkan`}
        />
      </div>

      <div className="grid gap-6">
        {online && (
          <Card title="Denah Status Meja (Live)" subtitle="Diperbarui setiap 30 detik dari kamera">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tables.map((t) => {
                const occupied = t.status === "OCCUPIED";
                return (
                  <li
                    key={t.id}
                    className={`rounded-2xl border p-3 ${
                      occupied
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30"
                        : "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/30"
                    }`}
                  >
                    <div className="text-sm font-black text-forest">{t.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-ink-2">
                      {occupied ? <Users aria-hidden className="size-3.5" /> : <Armchair aria-hidden className="size-3.5" />}
                      {occupied ? `Terisi · ${t.personCount} orang` : "Kosong"}
                    </div>
                    {occupied && t.dwellSec > 0 && (
                      <div className="mt-0.5 text-xs font-semibold text-muted">{fmtMin(t.dwellSec / 60)} duduk</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card
          title="Log Perubahan Status Meja"
          subtitle={changes.length > 100 ? "Menampilkan 100 perubahan terbaru" : "Diurutkan dari yang terbaru"}
        >
          <Table
            maxH="max-h-72"
            head={["Waktu", "Deskripsi Kejadian", "Bukti"]}
            rows={changes.slice(0, 100).map((e) => [fmtTime(e.ts), describe(e), <Evidence key="v" e={e} />])}
            empty="Belum ada perubahan status meja pada hari ini."
          />
        </Card>
      </div>
    </div>
  );
}

