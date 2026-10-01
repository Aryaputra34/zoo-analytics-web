import { BadgeCheck, LogIn, LogOut, ScanLine, Search } from "lucide-react";
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
  const exits = evs.filter((e) => e.data.direction === "EXIT");
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
        tag="Taman Safari Bogor · Gerbang Utama 1 & 2"
        title="Safari Journey · Gerbang Kendaraan"
        subtitle="Penghitungan otomatis kendaraan masuk & keluar koridor satwa liar dengan pengenalan plat nomor AI (ANPR)"
        date={date}
      >
        <CsvLink href={`/api/events?date=${date}&useCase=vehicle_gate&eventType=vehicle_crossing`} />
      </PageHeader>

      <Tiles>
        <Tile
          label="Kendaraan Masuk (In)"
          value={fmtNum(entries.length)}
          icon={<LogIn aria-hidden />}
          sub={`${fmtNum(Math.max(0, entries.length - exits.length))} masih di dalam area Safari`}
        />
        <Tile
          label="Kendaraan Keluar (Out)"
          value={fmtNum(exits.length)}
          icon={<LogOut aria-hidden />}
          sub="Menuju area rekreasi & parkir"
        />
        <Tile
          label="Plat Terbaca (ANPR)"
          icon={<ScanLine aria-hidden />}
          value={pct(read.length, evs.length)}
          sub={`${fmtNum(read.length)} dari ${fmtNum(evs.length)} kendaraan`}
        />
        <Tile
          label="Format Plat Indonesia Sah"
          icon={<BadgeCheck aria-hidden />}
          value={pct(valid.length, read.length)}
          sub={`${fmtNum(valid.length)} dari ${fmtNum(read.length)} plat tervalidasi`}
        />
      </Tiles>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Volume Lintasan Kendaraan per Jam" subtitle="Distribusi kepadatan arus masuk & keluar per jam" className="lg:col-span-2">
          <HourlyBars
            data={hourly}
            series={[
              { key: "entries", label: "Masuk (Entry)" },
              { key: "exits", label: "Keluar (Exit)" },
            ]}
          />
        </Card>
        <Card title="Klasifikasi Jenis Kendaraan" subtitle="Tipe moda transportasi pengunjung">
          <Table
            head={["Jenis", "Masuk", "Keluar", "Pangsa"]}
            align={["left", "right", "right", "right"]}
            rows={types.map(([t, c]) => [
              <span key="t" className="font-extrabold capitalize text-forest">
                {t}
              </span>,
              fmtNum(c.in),
              fmtNum(c.out),
              <span key="s" className="font-bold text-lime-dark dark:text-lime">
                {pct(c.in + c.out, evs.length)}
              </span>,
            ])}
            empty="Tidak ada lintasan kendaraan pada hari ini."
          />
        </Card>
      </div>

      <Card
        title="Log Deteksi Plat Nomor Kendaraan (ANPR)"
        subtitle={`${q ? `${fmtNum(matches.length)} plat sesuai pencarian “${q}” · ` : ""}Data deteksi terbaru${matches.length > 200 ? " (menampilkan 200 data teratas)" : ""}`}
        actions={
          <form className="flex items-center gap-1.5" role="search">
            {date !== todayWib() && <input type="hidden" name="date" value={date} />}
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari plat nomor, cth: B 1234, F 88..."
                className="h-9 w-60 rounded-full border border-line bg-surface pr-3 pl-9 text-xs font-bold text-forest placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>
          </form>
        }
      >
        <Table
          head={["Waktu", "Plat Nomor", "Tipe", "Arah", "Akurasi OCR", "Status"]}
          align={["left", "left", "left", "left", "right", "left"]}
          rows={matches.slice(0, 200).map((e) => [
            fmtTime(e.ts),
            <Mono key="p">{e.data.plate}</Mono>,
            <span key="t" className="capitalize font-semibold text-ink-2">
              {e.data.vehicleType}
            </span>,
            e.data.direction === "ENTRY" ? (
              <span key="d" className="inline-flex items-center gap-1 font-bold text-forest">
                ↙ Masuk
              </span>
            ) : (
              <span key="d" className="inline-flex items-center gap-1 font-bold text-muted">
                ↗ Keluar
              </span>
            ),
            e.data.plate === "UNIDENTIFIED" ? "—" : pct(Number(e.data.ocrConfidence) || 0, 1),
            e.data.plate === "UNIDENTIFIED" ? (
              <Badge key="v" tone="off">
                Tidak Terbaca
              </Badge>
            ) : e.data.plateValid ? (
              <Badge key="v" tone="good">
                Sah SAMSAT
              </Badge>
            ) : (
              <Badge key="v" tone="warn">
                Perlu Cek
              </Badge>
            ),
          ])}
          empty={q ? `Tidak ada plat sesuai “${q}” pada ${date}.` : `Tidak ada kendaraan pada ${date}.`}
        />
        <Note>
          Plat &quot;Sah SAMSAT&quot; berarti susunan karakter sesuai pola registrasi kepolisian Republik Indonesia (contoh: B 1234 ABC, F 8888 SAFARI).
        </Note>
      </Card>
    </>
  );
}

