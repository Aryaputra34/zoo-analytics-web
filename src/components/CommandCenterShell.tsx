"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Car,
  Cctv,
  ChevronLeft,
  ChevronRight,
  CodeXml,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Store,
  Sun,
  Ticket,
  Utensils,
  X,
} from "lucide-react";
import { AutoRefresh } from "./client";

export const NAV_SECTIONS = [
  {
    title: "Pusat Kendali",
    items: [
      { href: "/", label: "Ringkasan", sub: "Command Center", Icon: LayoutDashboard },
      { href: "/live", label: "Live Sensor CCTV", sub: "4 AI Cameras", Icon: Cctv, badge: "Live" },
      { href: "/events", label: "Log Kejadian AI", sub: "Audit & CSV", Icon: ScrollText },
    ],
  },
  {
    title: "Zona Operasional",
    items: [
      { href: "/vehicles", label: "Gerbang Safari", sub: "Vehicle Corridor", Icon: Car },
      { href: "/cashier", label: "Loket & Retail", sub: "Ticket Presence", Icon: Store },
      { href: "/restaurant", label: "Safari Dining", sub: "Dining & Tables", Icon: Utensils },
      { href: "/rides", label: "Wahana Kuda", sub: "Pony Arena", Icon: Ticket },
    ],
  },
  {
    title: "Sistem & Integrasi",
    items: [
      { href: "/api-docs", label: "OpenAPI / Swagger", sub: "Edge AI API", Icon: CodeXml },
    ],
  },
];

export function CommandCenterShell({
  children,
  showLogout = false,
}: {
  children: ReactNode;
  showLogout?: boolean;
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tamansafari_theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("tamansafari_theme", newTheme);
  };

  // Find active label for the breadcrumb in top bar
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const currentItem = allItems.find((item) =>
    item.href === "/" ? path === "/" : path.startsWith(item.href)
  ) ?? allItems[0];

  return (
    <div className="flex min-h-screen bg-bg text-ink selection:bg-lime selection:text-forest transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDEBAR: Desktop (collapsible) & Mobile Drawer
      ─────────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-forest-dark text-white transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-68"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3 overflow-hidden"
          >
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-1.5 shadow-inner ring-1 ring-lime/40 backdrop-blur-sm transition-transform group-hover:scale-105">
              <Image
                src="/logo_safari.svg"
                alt="Taman Safari Logo"
                width={36}
                height={36}
                className="size-full object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 transition-opacity duration-300">
                <div className="text-[10px] font-black tracking-[0.2em] text-lime uppercase">
                  Taman Safari
                </div>
                <div className="truncate text-base font-black tracking-tight text-white">
                  AI Command <span className="text-lime font-bold">NOC</span>
                </div>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Live Status Pill under header (visible when expanded) */}
        {!collapsed && (
          <div className="border-b border-white/10 bg-forest/30 px-4 py-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="flex items-center gap-1.5 text-lime">
                <span className="size-2 rounded-full bg-lime camera-pulse" />
                LIVE TELEMETRY
              </span>
              <span className="text-white/60 font-semibold">Cisarua Bogor</span>
            </div>
          </div>
        )}

        {/* Nav Sections */}
        <nav
          aria-label="Pusat Kendali"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [scrollbar-width:thin]"
        >
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.title}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-lime/70">
                  {sec.title}
                </div>
              )}
              <div className="space-y-1">
                {sec.items.map(({ href, label, sub, Icon, badge }) => {
                  const active = href === "/" ? path === "/" : path.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? `${label} (${sub})` : undefined}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-lime text-forest font-black shadow-md shadow-lime/20"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`size-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                          active ? "text-forest" : "text-lime"
                        }`}
                      />
                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between min-w-0">
                          <div className="truncate">
                            <div>{label}</div>
                            <div
                              className={`text-[10px] font-semibold truncate ${
                                active ? "text-forest/75" : "text-white/50"
                              }`}
                            >
                              {sub}
                            </div>
                          </div>
                          {badge && (
                            <span
                              className={`ml-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                                active
                                  ? "bg-forest/20 text-forest"
                                  : "bg-lime/20 text-lime"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Edge Infrastructure Status Card */}
        {!collapsed ? (
          <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs backdrop-blur-sm">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-lime uppercase tracking-wider">
              <span>Sensor Edge Core</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-white/70">
              <div className="flex justify-between">
                <span>AI Vision:</span>
                <span className="font-mono text-white/90">YOLOv8 (:8000)</span>
              </div>
              <div className="flex justify-between">
                <span>MediaMTX:</span>
                <span className="font-mono text-white/90">MP4 Clip (:9996)</span>
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="font-mono text-white/90">SQLite WAL</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <div
              className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-lime"
              title="Edge AI Connected"
            >
              <Cpu className="size-4" />
            </div>
          </div>
        )}

        {/* Collapse Toggle on Desktop */}
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span>Ciutkan Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT WRAPPER: Top Bar + Content + Status Footer
      ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Compact Top Telemetry Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/90 px-4 sm:px-6 backdrop-blur-md transition-colors">
          {/* Left: Mobile Toggle & Breadcrumb / Live Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-forest lg:hidden"
              aria-label="Buka Menu"
            >
              <Menu className="size-4.5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted hidden sm:inline">
                Pusat Kendali
              </span>
              <span className="text-muted/40 hidden sm:inline">/</span>
              <span className="text-sm font-black text-forest">
                {currentItem.label}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-black text-forest dark:text-lime">
              <span className="size-2 rounded-full bg-lime camera-pulse" />
              <span>4/4 Kamera AI Online</span>
              <span className="text-muted/60">·</span>
              <span>100% Health</span>
            </div>
          </div>

          {/* Right: Controls (Sync, Theme, Logout) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <AutoRefresh />

            {/* Theme Toggle Button */}
            <div className="flex items-center rounded-full border border-line bg-surface-2 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`flex items-center gap-1 cursor-pointer rounded-full px-2 py-0.5 transition-colors ${
                  theme === "light"
                    ? "bg-lime text-forest font-black shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                title="Mode Siang"
              >
                <Sun className="size-3" />
                <span className="hidden sm:inline">Day</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`flex items-center gap-1 cursor-pointer rounded-full px-2 py-0.5 transition-colors ${
                  theme === "dark"
                    ? "bg-lime text-forest font-black shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                title="Mode Night Safari"
              >
                <Moon className="size-3" />
                <span className="hidden sm:inline">Night</span>
              </button>
            </div>

            {/* Logout (if authenticated) */}
            {showLogout && path !== "/login" && (
              <a
                href="/logout"
                className="flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-black text-muted hover:text-forest transition-colors"
                title="Keluar"
              >
                <LogOut className="size-3" />
                <span className="hidden sm:inline">Keluar</span>
              </a>
            )}
          </div>
        </header>

        {/* Main Work Area */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 max-w-[1700px] w-full mx-auto">
          {children}
        </main>

        {/* Streamlined Mission-Critical Operations Footer */}
        <footer className="border-t border-line bg-surface px-4 py-3 text-xs text-muted">
          <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-forest">Taman Safari Indonesia</span>
              <span>·</span>
              <span>Pusat Kendali AI Cisarua Bogor</span>
              <span>·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ● Seluruh Sistem Normal
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Waktu Operasional: 08:30 – 17:00 WIB (UTC+7)</span>
              <span>·</span>
              <span className="font-mono">v1.0.0-NOC</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
