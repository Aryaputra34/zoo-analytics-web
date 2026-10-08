"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CctvOff, ChevronLeft, ChevronRight, Film, Pause, Play, X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NAV } from "./nav";

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible">
      {NAV.map(({ href, label, Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              active ? "bg-lime text-forest" : "text-side-ink-2 hover:bg-white/10 hover:text-side-ink"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Re-renders the server components every 5 s while the tab is visible. Can be paused.
export function AutoRefresh() {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    if (paused) return;
    const stamp = () => setLast(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta" }));
    stamp();
    const id = setInterval(() => {
      if (document.hidden) return;
      router.refresh();
      stamp();
    }, 5000);
    return () => clearInterval(id);
  }, [paused, router]);
  return (
    <button
      type="button"
      onClick={() => setPaused((p) => !p)}
      className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-white/10"
      aria-label={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
    >
      {paused ? <Play aria-hidden className="size-3 text-zinc-300" /> : <Pause aria-hidden className="size-3 text-lime" />}
      <span className={`size-2 rounded-full ${paused ? "bg-zinc-400" : "bg-lime camera-pulse"}`} aria-hidden />
      <span className="text-[11px] font-extrabold">{paused ? "Sync Paused" : "Live Sync"}</span>
      {!paused && last && <span className="hidden sm:inline text-white/70 text-[10px]">· {last} WIB</span>}
    </button>
  );
}

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

// Day picker that keeps the other query params (filters) in the URL.
export function DatePicker({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const href = (d: string) => {
    const p = new URLSearchParams(sp);
    if (d === today) p.delete("date");
    else p.set("date", d);
    const qs = p.toString();
    return qs ? `${path}?${qs}` : path;
  };
  const btn = "grid size-9 place-items-center rounded-full border border-line bg-surface text-forest hover:bg-lime/20 hover:border-lime/60 shadow-sm transition-colors";
  return (
    <div className="flex items-center gap-1.5">
      <Link href={href(addDays(date, -1))} className={btn} aria-label="Previous day">
        <ChevronLeft aria-hidden className="size-4" />
      </Link>
      <input
        type="date"
        aria-label="Date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && router.push(href(e.target.value))}
        className="h-9 rounded-full border border-line bg-surface px-3 text-xs font-extrabold text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-lime"
      />
      {date < today ? (
        <Link href={href(addDays(date, 1))} className={btn} aria-label="Next day">
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={`${btn} opacity-40 cursor-not-allowed`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
      {date !== today && (
        <Link
          href={href(today)}
          className="h-9 rounded-full bg-forest text-lime px-4 text-xs leading-9 font-extrabold shadow-sm hover:bg-forest-dark transition-colors"
        >
          Today · Hari Ini
        </Link>
      )}
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--muted)", fontWeight: 600 };
const tooltipStyle = {
  contentStyle: {
    background: "#0d542e",
    border: "1px solid rgba(130, 187, 58, 0.4)",
    borderRadius: 14,
    fontSize: 12,
    color: "#ffffff",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    padding: "8px 12px",
  },
  labelStyle: { color: "#82bb3a", fontWeight: "bold", marginBottom: "4px" },
  itemStyle: { color: "#ffffff", fontSize: "11px", fontWeight: "bold" },
  cursor: { fill: "rgba(130, 187, 58, 0.08)" },
};

function Legend({ series }: { series: { label: string; color: string }[] }) {
  if (series.length < 2) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs font-extrabold text-forest">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 border border-line">
          <span className="size-2.5 rounded-full shadow-sm" style={{ background: s.color }} aria-hidden />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// Fixed categorical order with official Taman Safari brand colors
const SERIES_COLORS = ["#0d542e", "#82bb3a", "#f5a623", "#2080c4"];

export function HourlyBars({
  data,
  series,
  unit = "",
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  unit?: string;
}) {
  const s = series.map((x, i) => ({ ...x, color: SERIES_COLORS[i % SERIES_COLORS.length] }));
  return (
    <div>
      <Legend series={s} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
          <BarChart data={data} barGap={3} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tick={axis}
              tickLine={false}
              axisLine={{ stroke: "var(--axis)" }}
              tickFormatter={(h) => `${h}:00`}
            />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(h) => `${h}:00–${h}:59 WIB`}
              formatter={(v) => `${Math.round(Number(v) * 10) / 10}${unit}`}
            />
            {s.map((x) => (
              <Bar
                key={x.key}
                dataKey={x.key}
                name={x.label}
                fill={x.color}
                maxBarSize={28}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OccupancyChart({
  data,
  warning,
  max,
}: {
  data: { time: string; occupancy: number }[];
  warning: number;
  max: number;
}) {
  const top = Math.max(max, ...data.map((d) => d.occupancy)) + 5;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="safariGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82bb3a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0d542e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={axis} tickLine={false} axisLine={{ stroke: "var(--axis)" }} minTickGap={32} />
          <YAxis tick={axis} tickLine={false} axisLine={false} domain={[0, top]} allowDecimals={false} />
          <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--axis)" }} labelFormatter={(t) => `${t} WIB (5-min peak)`} />
          <ReferenceLine
            y={warning}
            stroke="#f5a623"
            strokeDasharray="4 4"
            label={{ value: `Warning ${warning}`, position: "insideTopLeft", fontSize: 11, fill: "#f5a623", fontWeight: 700 }}
          />
          <ReferenceLine
            y={max}
            stroke="#d9383a"
            strokeDasharray="4 4"
            label={{ value: `Max Limit ${max}`, position: "insideTopLeft", fontSize: 11, fill: "#d9383a", fontWeight: 700 }}
          />
          <Area
            type="monotone"
            dataKey="occupancy"
            name="Dining Guests"
            stroke="#0d542e"
            strokeWidth={3}
            fill="url(#safariGradient)"
            dot={false}
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#82bb3a" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const dialogCls =
  "m-auto w-[min(960px,calc(100vw-2rem))] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/70";
const closeBtn =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-surface text-forest hover:bg-lime/20";

// Thumbnail of an event's snapshot; opens the full snapshot and the recorded clip around the event.
// The clip is only requested while the dialog is open.
export function EvidenceButton({ snapshot, clip, title }: { snapshot?: string; clip?: string; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [clipFailed, setClipFailed] = useState(false);
  if (!snapshot && !clip) return <span className="text-muted">—</span>;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
        aria-label={`Lihat bukti kejadian ${title}`}
        className="group relative block h-10 w-16 cursor-pointer overflow-hidden rounded-lg border border-line bg-surface-2 hover:ring-2 hover:ring-lime"
      >
        {snapshot ? (
          // eslint-disable-next-line @next/next/no-img-element -- proxied JPEG from the AI engine, nothing to optimize
          <img src={snapshot} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <Film aria-hidden className="m-auto size-4 text-forest" />
        )}
        {clip && (
          <span className="absolute right-0.5 bottom-0.5 grid size-4 place-items-center rounded-full bg-forest/90 text-lime">
            <Play aria-hidden className="size-2.5" />
          </span>
        )}
      </button>
      <dialog
        ref={dialog}
        onClose={() => {
          setOpen(false);
          setClipFailed(false);
        }}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className={dialogCls}
      >
        {open && (
          <div className="grid gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-forest">{title}</h2>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Tutup" className={closeBtn}>
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <div className={`grid gap-4 ${snapshot && clip ? "md:grid-cols-2" : ""}`}>
              {snapshot && (
                <figure className="grid gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- proxied JPEG from the AI engine */}
                  <img src={snapshot} alt={`Snapshot ${title}`} className="w-full rounded-xl bg-black" />
                  <figcaption className="text-xs font-semibold text-muted">Snapshot saat kejadian (anotasi AI)</figcaption>
                </figure>
              )}
              {clip && (
                <figure className="grid gap-1.5">
                  {clipFailed ? (
                    <div className="grid aspect-video place-items-center rounded-xl bg-surface-2 p-4 text-center text-xs font-bold text-ink-2">
                      Rekaman untuk kejadian ini belum atau tidak lagi tersedia.
                    </div>
                  ) : (
                    <video
                      src={clip}
                      controls
                      autoPlay
                      muted
                      playsInline
                      onError={() => setClipFailed(true)}
                      className="w-full rounded-xl bg-black"
                    />
                  )}
                  <figcaption className="text-xs font-semibold text-muted">
                    Klip rekaman 15 detik sebelum s/d 15 detik sesudah kejadian
                  </figcaption>
                </figure>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

type LiveCam = { id: string; name: string; useCase: string; fps: number; online: boolean };

// Camera grid from the AI engine: stills refreshed every 2 s (one request each), and the annotated MJPEG
// stream only for the camera that is opened. A grid of streams would use up the browser's ~6 connections.
export function LiveGrid({ labels }: { labels: Record<string, string> }) {
  const [cams, setCams] = useState<LiveCam[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [focus, setFocus] = useState<LiveCam | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let alive = true;
    let loaded = false;
    const load = async () => {
      if (loaded && document.hidden) return; // a background tab still gets its first load
      try {
        const r = await fetch("/api/ai/health", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j: { cameras: LiveCam[] } = await r.json();
        if (!alive) return;
        loaded = true;
        setCams(j.cameras);
        setFailed(false);
        setTick((t) => t + 1);
      } catch {
        if (alive) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (failed && !cams)
    return (
      <div className="rounded-[24px] border border-line bg-surface p-10 text-center text-sm font-bold text-ink-2 shadow-sm">
        Mesin AI tidak dapat dihubungi. Pastikan layanan zoo-vision berjalan dan AI_ENGINE_URL benar.
      </div>
    );
  if (!cams) return <div className="py-10 text-center text-sm font-bold text-muted">Memuat kamera…</div>;

  return (
    <>
      {failed && (
        <p role="status" className="mb-3 text-xs font-bold text-amber-700 dark:text-amber-400">
          Koneksi ke mesin AI terputus. Gambar di bawah mungkin tidak terbaru.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cams.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!c.online}
            onClick={() => {
              setFocus(c);
              dialog.current?.showModal();
            }}
            className="group overflow-hidden rounded-[24px] border border-line bg-surface text-left shadow-sm transition-all enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:border-lime/60 enabled:hover:shadow-lg"
          >
            <div className="grid aspect-video place-items-center bg-black">
              {c.online ? (
                // eslint-disable-next-line @next/next/no-img-element -- live JPEG from the AI engine
                <img
                  src={`/api/ai/frame/${encodeURIComponent(c.id)}?t=${tick}`}
                  alt={`Pratinjau ${c.name}`}
                  className="size-full object-contain"
                />
              ) : (
                <CctvOff aria-hidden className="size-8 text-zinc-500" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-forest">{c.name}</div>
                <div className="text-xs font-semibold text-muted">
                  {labels[c.useCase] ?? c.useCase}
                  {c.online && ` · ${c.fps} FPS`}
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                  c.online
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400"
                }`}
              >
                <span className={`size-2 rounded-full ${c.online ? "bg-emerald-500 camera-pulse" : "bg-zinc-400"}`} aria-hidden />
                {c.online ? "Online" : "Offline"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setFocus(null)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className={dialogCls}
      >
        {focus && (
          <div className="grid gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-forest">
                {focus.name} <span className="font-semibold text-muted">· langsung, anotasi AI</span>
              </h2>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Tutup" className={closeBtn}>
                <X aria-hidden className="size-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- MJPEG stream; unmounting the img ends it */}
            <img
              src={`/api/ai/stream/${encodeURIComponent(focus.id)}`}
              alt={`Video langsung ${focus.name}`}
              className="w-full rounded-xl bg-black"
            />
          </div>
        )}
      </dialog>
    </>
  );
}

