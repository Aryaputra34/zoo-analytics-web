import { Clock, Hourglass, Ticket, Undo2 } from "lucide-react";
import Link from "next/link";
import { listEvents } from "@/lib/db";
import { byHour, dateParam, dayOf, dayRange, fmtNum, fmtTime, operatingHours, shiftDate, todayWib } from "@/lib/util";
import { Card, CsvLink, Evidence, Mono, Note, PageHeader, Table, Tile, Tiles } from "@/components/ui";
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
        tag="Taman Safari Bogor · Wahana Rekreasi Satwa"
        title="Wahana Tunggang Kuda (Pony Rides)"
        subtitle="Penghitungan AI tripwire setiap kuda poni yang berangkat & kembali dari lintasan arena untuk audit kesesuaian tiket penjualan POS"
        date={date}
      >
        <CsvLink href={`/api/events?date=${date}&useCase=horse_riding&eventType=horse_crossing`} />
      </PageHeader>

      <Tiles>
        <Tile
          label="Keberangkatan Wahana"
          icon={<Ticket aria-hidden />}
          value={fmtNum(dep)}
          sub="Validasi silang tiket kasir POS"
        />
        <Tile
          label="Kuda Kembali"
          icon={<Undo2 aria-hidden />}
          value={fmtNum(ret)}
          sub="Selesai putaran wahana"
        />
        <Tile
          label={isToday ? "Sedang di Lintasan" : "Selisih Akhir Hari"}
          icon={<Hourglass aria-hidden />}
          value={fmtNum(Math.max(0, dep - ret))}
          sub={isToday ? "Keberangkatan dikurangi kepulangan" : "Kuda belum tercatat kembali saat tutup"}
        />
        <Tile
          label="Jam Terpadat"
          icon={<Clock aria-hidden />}
          value={busiest.departures ? `${busiest.hour}:00 WIB` : "—"}
          sub={busiest.departures ? `${busiest.departures} kali keberangkatan` : "Belum ada aktivitas"}
        />
      </Tiles>

      <div className="mb-6 grid items-start gap-6 lg:grid-cols-3">
        <Card title="Aktivitas Wahana per Jam" subtitle="Grafik keberangkatan vs kepulangan kuda poni" className="lg:col-span-2">
          <HourlyBars
            data={hourly}
            series={[
              { key: "departures", label: "Berangkat (Departure)" },
              { key: "returns", label: "Kembali (Return)" },
            ]}
          />
        </Card>
        <Card title="Rekapitulasi 14 Hari Terakhir" subtitle="Total harian untuk rekonsiliasi kasir POS">
          <Table
            maxH="max-h-64"
            head={["Tanggal", "Berangkat", "Kembali"]}
            align={["left", "right", "right"]}
            rows={days.map((r) => [
              <Link
                key="d"
                href={r.d === todayWib() ? "/rides" : `/rides?date=${r.d}`}
                className={`font-bold transition-colors hover:text-lime-dark hover:underline ${r.d === date ? "font-extrabold text-forest" : "text-ink-2"}`}
              >
                {r.d}
              </Link>,
              fmtNum(r.dep),
              fmtNum(r.ret),
            ])}
          />
        </Card>
      </div>

      <Card
        title="Log Deteksi Lintasan Kuda (Crossing Stream)"
        subtitle={evs.length > 200 ? "Menampilkan 200 lintasan terbaru" : "Diurutkan dari yang terbaru"}
      >
        <Table
          head={["Waktu", "Arah Lintasan", "Kamera CCTV", "ID Objek Tracker", "Bukti"]}
          rows={evs
            .slice(0, 200)
            .map((e) => [
              fmtTime(e.ts),
              e.data.direction === "DEPARTURE" ? (
                <span key="d" className="inline-flex items-center gap-1 font-bold text-forest">
                  ↗ Berangkat
                </span>
              ) : (
                <span key="d" className="inline-flex items-center gap-1 font-bold text-muted">
                  ↙ Kembali
                </span>
              ),
              e.cameraName,
              <Mono key="t">{e.data.trackerId ?? "—"}</Mono>,
              <Evidence key="v" e={e} />,
            ])}
          empty={`Tidak ada lintasan wahana kuda pada ${date}.`}
        />
        <Note>
          Penghitungan berasal dari garis deteksi tripwire AI kamera. Kolom Bukti menampilkan snapshot dan klip rekaman setiap lintasan.
        </Note>
      </Card>
    </>
  );
}

