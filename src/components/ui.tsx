import type { ReactNode } from "react";
import { CircleCheck, CircleDot, Download, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Severity } from "@/lib/db";
import { todayWib } from "@/lib/util";
import { DatePicker } from "./client";

export function PageHeader({
  title,
  subtitle,
  date,
  children,
}: {
  title: string;
  subtitle?: string;
  date?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {date && <DatePicker date={date} today={todayWib()} />}
      </div>
    </header>
  );
}

export function Tile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-sm text-ink-2">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export const Tiles = ({ children }: { children: ReactNode }) => (
  <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
);

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-line bg-surface ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export type Tone = "good" | "warn" | "crit" | "off" | "info";
const TONE: Record<Tone, { Icon: typeof Info; cls: string }> = {
  good: { Icon: CircleCheck, cls: "text-good" },
  warn: { Icon: TriangleAlert, cls: "text-warn" },
  crit: { Icon: OctagonAlert, cls: "text-crit" },
  off: { Icon: CircleDot, cls: "text-off" },
  info: { Icon: Info, cls: "text-accent" },
};

// Status = icon + label (never colour alone); the label stays in ink colour.
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { Icon, cls } = TONE[tone];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs text-ink">
      <Icon aria-hidden className={`size-3.5 ${cls}`} />
      {children}
    </span>
  );
}

const SEV: Record<Severity, [Tone, string]> = {
  info: ["info", "Info"],
  warning: ["warn", "Warning"],
  critical: ["crit", "Critical"],
};
export const SeverityBadge = ({ severity }: { severity: Severity }) => <Badge tone={SEV[severity][0]}>{SEV[severity][1]}</Badge>;

export const OnlineBadge = ({ online }: { online: boolean }) =>
  online ? <Badge tone="good">Online</Badge> : <Badge tone="off">Offline</Badge>;

export function Table({
  head,
  rows,
  align = [],
  empty = "Nothing to show.",
  maxH = "",
}: {
  head: string[];
  rows: ReactNode[][];
  align?: ("left" | "right")[];
  empty?: string;
  maxH?: string;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className={`-mx-4 overflow-x-auto ${maxH && `${maxH} overflow-y-auto`}`}>
      <table className="w-full text-sm">
        <thead className={maxH && "sticky top-0 bg-surface"}>
          <tr className="border-b border-line text-left text-xs text-muted">
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-4 pb-2 font-medium ${align[i] === "right" ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`whitespace-nowrap px-4 py-2 text-ink ${align[j] === "right" ? "text-right" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="py-8 text-center text-sm text-muted">{children}</p>;

export const Mono = ({ children }: { children: ReactNode }) => <span className="font-mono text-[0.8125rem]">{children}</span>;

export function CsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-sm text-ink-2 hover:bg-surface-2"
    >
      <Download aria-hidden className="size-4" />
      Export CSV
    </a>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <p className="mt-4 text-xs text-muted">{children}</p>;
