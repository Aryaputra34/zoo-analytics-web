"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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
            className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-surface-2 font-medium text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon aria-hidden className={`size-4 ${active ? "text-accent" : ""}`} />
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
      className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:bg-surface-2 cursor-pointer"
      aria-label={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
    >
      {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
      <span className={`size-1.5 rounded-full ${paused ? "bg-off" : "bg-good"}`} aria-hidden />
      {paused ? "Paused" : `Live${last ? ` · ${last}` : ""}`}
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
  const btn = "grid size-8 place-items-center rounded-md border border-line text-ink-2 hover:bg-surface-2";
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
        className="h-8 rounded-md border border-line bg-surface px-2 text-sm text-ink"
      />
      {date < today ? (
        <Link href={href(addDays(date, 1))} className={btn} aria-label="Next day">
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={`${btn} opacity-40`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
      {date !== today && (
        <Link
          href={href(today)}
          className="h-8 rounded-md border border-line px-2.5 text-sm leading-8 text-ink-2 hover:bg-surface-2"
        >
          Today
        </Link>
      )}
    </div>
  );
}

const axis = { fontSize: 12, fill: "var(--muted)" };
const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--ink)",
  },
  labelStyle: { color: "var(--ink-2)" },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--surface-2)" },
};

function Legend({ series }: { series: { label: string; color: string }[] }) {
  if (series.length < 2) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-2">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// Fixed categorical order (CVD-validated); more than 4 series should be split into separate charts.
const SERIES_COLORS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];

export function HourlyBars({
  data,
  series,
  unit = "",
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  unit?: string;
}) {
  const s = series.map((x, i) => ({ ...x, color: SERIES_COLORS[i] }));
  return (
    <div>
      <Legend series={s} />
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 240 }}>
          <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
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
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
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
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="time" tick={axis} tickLine={false} axisLine={{ stroke: "var(--axis)" }} minTickGap={32} />
          <YAxis tick={axis} tickLine={false} axisLine={false} domain={[0, top]} allowDecimals={false} />
          <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--axis)" }} labelFormatter={(t) => `${t} WIB (5-min peak)`} />
          <ReferenceLine
            y={warning}
            stroke="var(--warn)"
            label={{ value: `Warning ${warning}`, position: "insideTopLeft", fontSize: 11, fill: "var(--ink-2)" }}
          />
          <ReferenceLine
            y={max}
            stroke="var(--crit)"
            label={{ value: `Max ${max}`, position: "insideTopLeft", fontSize: 11, fill: "var(--ink-2)" }}
          />
          <Area
            type="monotone"
            dataKey="occupancy"
            name="People"
            stroke="var(--s1)"
            strokeWidth={2}
            fill="var(--s1)"
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
