import { BellRing, Hourglass, Timer, Users } from "lucide-react";
import { latestStatus, listEvents, type Ev } from "@/lib/db";
import {
  STATUS_SEC,
  byHour,
  dateParam,
  dayRange,
  describe,
  fmtMin,
  fmtNum,
  fmtTime,
  isOnline,
  operatingHours,
  todayWib,
} from "@/lib/util";
import { Badge, Card, Empty, Note, OnlineBadge, PageHeader, SeverityBadge, Table, Tile } from "@/components/ui";
import { HourlyBars } from "@/components/client";

const absent = (e: Ev) => e.eventType === "status" && e.data.clerkPresent === false;

function stateTone(state: string) {
  if (state.startsWith("ALERT")) return "crit" as const;
  if (state.includes("UNATTENDED")) return "warn" as const;
  return "good" as const;
}

export default async function Cashier(props: PageProps<"/cashier">) {
  const sp = await props.searchParams;
  const date = dateParam(sp.date);
  const isToday = date === todayWib();
  const [from, to] = dayRange(date);
  const [evs, statuses] = await Promise.all([listEvents({ from, to, useCase: "cashier_presence" }), latestStatus()]);

  const desks = new Map<string, string>();
  for (const e of [...statuses.filter((s) => s.useCase === "cashier_presence"), ...evs]) desks.set(e.cameraId, e.cameraName);
  const alerts = evs.filter((e) => e.eventType !== "status");
  const deskList = [...desks.entries()];

  const hourly = operatingHours(
    byHour(
      evs,
      Object.fromEntries(deskList.map(([id]) => [id, (e: Ev) => (e.cameraId === id && absent(e) ? STATUS_SEC / 60 : 0)])),
    ),
    (r) => deskList.every(([id]) => !r[id]),
  );

  return (
    <>
      <PageHeader
        tag="Taman Safari Bogor · Area Plaza Tiket & Loket"
        title="Loket Tiket & Mini Train"
        subtitle="Pemantauan AI kehadiran petugas loket kasir, peringatan loket tanpa staf, dan deteksi antrean pengunjung"
        date={date}
      />

      {deskList.length === 0 && (
        <Card>
          <Empty>Belum ada laporan kamera CCTV loket pada {date}.</Empty>
        </Card>
      )}

      {deskList.map(([id, name]) => {
        const mine = evs.filter((e) => e.cameraId === id);
        const status = statuses.find((s) => s.cameraId === id);
        const online = isOnline(status);
        const unattended = mine.filter((e) => e.eventType === "cashier_unattended");
        const waiting = mine.filter((e) => e.eventType === "customer_waiting");
        const longestAbsence = Math.max(0, ...unattended.map((e) => Number(e.data.absentSec) || 0));
        const longestWait = Math.max(0, ...waiting.map((e) => Number(e.data.waitingSec) || 0));
        return (
          <Card
            key={id}
            title={name}
            subtitle={`ID Sensor: ${id}`}
            className="mb-6"
            actions={
              <div className="flex items-center gap-2">
                {isToday && status && online && <Badge tone={stateTone(status.data.state)}>{status.data.state}</Badge>}
                <OnlineBadge online={online} />
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile
                label="Durasi Loket Kosong"
                icon={<Timer aria-hidden />}
                value={fmtMin((mine.filter(absent).length * STATUS_SEC) / 60)}
                sub="Sampling tiap 30 detik"
              />
              <Tile
                label="Peringatan Tanpa Petugas"
                icon={<BellRing aria-hidden />}
                value={fmtNum(unattended.length)}
                sub={`Kosong terlama ${fmtMin(longestAbsence / 60)}`}
              />
              <Tile
                label="Pengunjung Menunggu"
                icon={<Hourglass aria-hidden />}
                value={fmtNum(waiting.length)}
                sub={`Menunggu terlama ${longestWait} detik`}
              />
              <Tile
                label="Kondisi Saat Ini"
                icon={<Users aria-hidden />}
                value={isToday && online ? `${status!.data.clerkCount} staf / ${status!.data.visitorCount} antre` : "—"}
                sub={isToday && online ? "Petugas & Pengunjung di loket" : "Kamera Offline"}
              />
            </div>
          </Card>
        );
      })}

      {deskList.length > 0 && (
        <div className="grid gap-6">
          <Card title="Menit Loket Tanpa Petugas per Jam" subtitle="Grafik akumulasi durasi ketidakhadiran staf loket per jam">
            <HourlyBars data={hourly} series={deskList.map(([id, name]) => ({ key: id, label: name }))} unit=" mnt" />
          </Card>
          <Card
            title="Kronologi Peringatan Loket (Alerts)"
            subtitle={alerts.length > 200 ? "Menampilkan 200 insiden terbaru" : "Diurutkan dari yang terbaru"}
          >
            <Table
              maxH="max-h-96"
              head={["Waktu", "Loket", "Deteksi / Kejadian", "Tingkat"]}
              rows={alerts
                .slice(0, 200)
                .map((e) => [fmtTime(e.ts), e.cameraName, describe(e), <SeverityBadge key="s" severity={e.severity} />])}
              empty={`Tidak ada peringatan loket pada ${date}. Pelayanan prima.`}
            />
            <Note>Peringatan dikirim berulang setiap 30 detik selama kondisi loket kosong atau pengunjung menunggu tetap berlangsung.</Note>
          </Card>
        </div>
      )}
    </>
  );
}

