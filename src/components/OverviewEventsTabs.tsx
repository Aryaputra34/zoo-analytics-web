"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert } from "lucide-react";

export function OverviewEventsTabs({
  alertsCount,
  criticalCount,
  opCount,
  date,
  isToday,
  alertsContent,
  summaryContent,
}: {
  alertsCount: number;
  criticalCount: number;
  opCount: number;
  date: string;
  isToday: boolean;
  alertsContent: ReactNode;
  summaryContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"summary" | "alerts">("summary");

  return (
    <section className="min-w-0 rounded-[24px] border border-line bg-surface shadow-sm overflow-hidden xl:col-span-3">
      {/* Top subtle lime accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-forest via-lime to-forest opacity-80" />

      {/* Header with Tabs and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selector Pills */}
          <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1 border border-line/60">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                activeTab === "summary"
                  ? "bg-forest text-lime shadow-sm"
                  : "text-ink hover:text-forest hover:bg-surface/60"
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Ringkasan Tipe Event</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors ${
                  activeTab === "summary"
                    ? "bg-lime/20 text-lime"
                    : "bg-surface text-forest"
                }`}
              >
                {opCount.toLocaleString("id-ID")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-forest text-lime shadow-sm"
                  : "text-ink hover:text-forest hover:bg-surface/60"
              }`}
            >
              <ShieldAlert className="size-3.5" />
              <span>Peringatan Sistem</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors ${
                  criticalCount > 0
                    ? "bg-red-600 text-white font-black animate-pulse"
                    : alertsCount > 0
                    ? "bg-amber-500 text-white font-black"
                    : activeTab === "alerts"
                    ? "bg-lime/20 text-lime"
                    : "bg-surface text-forest"
                }`}
              >
                {alertsCount.toLocaleString("id-ID")}
              </span>
            </button>
          </div>
        </div>

        {/* Action Link to Full Log */}
        <Link
          href={`/events${isToday ? "" : `?date=${date}`}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-lime/20 px-3.5 py-1.5 text-xs font-black text-forest hover:bg-lime/30 transition-all hover:scale-[1.02]"
        >
          Lihat Log Lengkap <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>

      {/* Tab Body */}
      <div className="p-5 sm:p-6">
        {activeTab === "summary" ? summaryContent : alertsContent}
      </div>
    </section>
  );
}
