import { BellRing, Clock, TrendingUp, Users, Utensils } from "lucide-react";
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
      <PageHeader
        tag="Taman Safari Bogor · Area Kuliner & Restoran"
        title="Safari Cafe & Rainforest Dining Hall"
        subtitle="Penghitungan AI okupansi pengunjung di dalam area santap terhadap batas aman (warning) dan batas kapasitas maksimum"
        date={date}
      />

      {cams.size === 0 && (
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
                  head={["Waktu", "Deskripsi Kejadian", "Tingkat Peringatan"]}
                  rows={alerts
                    .slice(0, 100)
                    .map((e) => [fmtTime(e.ts), describe(e), <SeverityBadge key="s" severity={e.severity} />])}
                  empty="Tidak ada pelanggaran batas kapasitas pada hari ini. Kapasitas selalu aman."
                />
              </Card>
            </div>
          </div>
        );
      })}
    </>
  );
}

