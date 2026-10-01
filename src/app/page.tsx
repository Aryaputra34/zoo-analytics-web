"use client";

import React, { useState, useEffect } from 'react';
import {
  Car,
  CreditCard,
  Utensils,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Server,
  Eye
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  initialSummary,
  hourlyTrafficData,
  vehicleTypeBreakdown,
  mockRecentEvents,
  mockCashierDesks,
  mockVehiclePlates,
  DashboardSummary
} from '@/lib/mockData';
import { AnalyticsEvent, UseCaseType } from '@/types/analytics';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | UseCaseType>('overview');
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const [events, setEvents] = useState<AnalyticsEvent[]>(mockRecentEvents);
  const [plateSearch, setPlateSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveMode] = useState(true);

  // Fetch telemetry from local API
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const json = await res.json();
        if (json.summary) setSummary(json.summary);
        if (json.events && json.events.length > 0) setEvents(json.events);
      }
    } catch (e) {
      console.warn('Using local client state', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      if (liveMode) refreshData();
    }, 6000);
    return () => clearInterval(interval);
  }, [liveMode]);

  const filteredPlates = mockVehiclePlates.filter((p) =>
    p.plate.toLowerCase().includes(plateSearch.toLowerCase()) ||
    p.type.toLowerCase().includes(plateSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Zoo & Safari AI Vision Analytics</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Nx Meta REST API v3 Integration • 300-Camera Estate Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edge AI Server: <strong className="text-white font-medium">Online (RTX 4080)</strong></span>
            </div>

            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {[
            { id: 'overview', label: 'Executive Overview', icon: Activity },
            { id: 'vehicle_gate', label: 'Vehicle Gate & ANPR', icon: Car },
            { id: 'cashier_presence', label: 'Cashier Presence', icon: CreditCard },
            { id: 'restaurant_counter', label: 'Restaurant Headcount', icon: Utensils },
            { id: 'horse_riding', label: 'Horse Riding Audit', icon: TrendingUp },
            { id: 'feeding_hazard', label: 'Feeding Hazard Alerts', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Vehicles (Today)</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{summary.totalVehiclesToday}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">+{summary.vehiclesIn} in</span>
                <span>•</span>
                <span className="text-slate-400">{summary.vehiclesOut} out</span>
              </div>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Cashier Stations</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{summary.activeCashiers} / {summary.totalCashiers}</div>
              <div className="text-xs mt-1 flex items-center gap-1 font-medium text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>1 desk unattended</span>
              </div>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Restaurant Headcount</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{summary.restaurantCurrentOccupancy} / {summary.restaurantMaxCapacity}</div>
              <div className="text-xs mt-1 text-amber-400 font-medium">
                <span>92% (Near Limit)</span>
              </div>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Horse Rides Audited</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{summary.horseRidersAudited}</div>
              <div className="text-xs mt-1 text-slate-400 flex items-center gap-1">
                <span>POS: {summary.horsePosTicketsSold}</span>
                <span className="text-amber-400 font-medium">(+2 diff)</span>
              </div>
            </div>
          </div>

          {/* KPI 5 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Feeding Hazards</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{summary.feedingHazardsToday}</div>
              <div className="text-xs mt-1 text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>1 action required</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Urgent Alert Banner */}
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-rose-300">High Priority Operational Alert</h4>
                  <p className="text-xs text-rose-200/80 mt-1">
                    Giraffe Feeding Platform: Prohibited plastic bag (<em>kresek</em>) detected in visitor hand (Confidence: 94%).
                    Bookmark created on Nx Witness timeline (#feeding_hazard).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('feeding_hazard')}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition whitespace-nowrap cursor-pointer"
              >
                Inspect Alert
              </button>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Trend */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Today's Traffic & Dining Flow</h3>
                    <p className="text-xs text-slate-400">Hourly comparison between Gate Vehicles and Restaurant Diners</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    Peak: 11:00 - 12:00
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorResto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="vehicles" name="Vehicles In" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVehicles)" />
                      <Area type="monotone" dataKey="restaurantIn" name="Restaurant Diners" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResto)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Vehicle Distribution Donut */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Gate Vehicle Breakdown</h3>
                  <p className="text-xs text-slate-400">Classification by YOLOv11 detector</p>
                </div>

                <div className="h-44 w-full flex items-center justify-center my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleTypeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {vehicleTypeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {vehicleTypeBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300">{item.name}: <strong className="text-white font-medium">{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Unified Activity Timeline */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Unified Real-Time Event Feed</h3>
                  <p className="text-xs text-slate-400">Latest bookmarks and alerts pushed by Vision Engine</p>
                </div>
                <span className="text-xs text-slate-400">Auto-updating</span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {events.slice(0, 5).map((ev) => (
                  <div key={ev.eventId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        ev.severity === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                        ev.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {ev.useCase === 'vehicle_gate' && <Car className="w-4 h-4" />}
                        {ev.useCase === 'cashier_presence' && <CreditCard className="w-4 h-4" />}
                        {ev.useCase === 'restaurant_counter' && <Utensils className="w-4 h-4" />}
                        {ev.useCase === 'horse_riding' && <TrendingUp className="w-4 h-4" />}
                        {ev.useCase === 'feeding_hazard' && <AlertTriangle className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{ev.cameraName}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {ev.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ev.useCase === 'vehicle_gate' && `License Plate [${(ev.data as any).licensePlate}] crossed (${(ev.data as any).direction})`}
                          {ev.useCase === 'cashier_presence' && `Counter empty for ${(ev.data as any).absentDurationSec}s (${(ev.data as any).shiftOperator || 'Staff'})`}
                          {ev.useCase === 'restaurant_counter' && `Occupancy: ${(ev.data as any).currentOccupancy} / ${(ev.data as any).maxCapacity} (${(ev.data as any).occupancyPct}%)`}
                          {ev.useCase === 'horse_riding' && `Rider departure recorded. Daily total: ${(ev.data as any).dailyCumulativeRiders}`}
                          {ev.useCase === 'feeding_hazard' && `Hazard: ${(ev.data as any).detectedItem} (${Math.round((ev.data as any).confidence * 100)}% conf)`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: VEHICLE GATE & ANPR */}
        {/* ========================================================================= */}
        {activeTab === 'vehicle_gate' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Vehicle Gate & Indonesian ANPR</h2>
                <p className="text-xs text-slate-400">Automated license plate recognition and vehicle classification at park gates</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search license plate (e.g. B 1892)..."
                  value={plateSearch}
                  onChange={(e) => setPlateSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Live License Plate Audits</h3>
                <span className="text-xs text-slate-400">Showing {filteredPlates.length} results</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-medium">Time</th>
                      <th className="py-3 px-4 font-medium">License Plate</th>
                      <th className="py-3 px-4 font-medium">Vehicle Type</th>
                      <th className="py-3 px-4 font-medium">Direction</th>
                      <th className="py-3 px-4 font-medium">OCR Confidence</th>
                      <th className="py-3 px-4 font-medium">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredPlates.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{row.time}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {row.plate}
                          </span>
                        </td>
                        <td className="py-3 px-4">{row.type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.direction === 'ENTRY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {row.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{Math.round(row.conf * 100)}%</td>
                        <td className="py-3 px-4">
                          {row.valid ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid ID Syntax
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Manual Review
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CASHIER PRESENCE */}
        {/* ========================================================================= */}
        {activeTab === 'cashier_presence' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Cashier Desk Presence Monitoring</h2>
              <p className="text-xs text-slate-400">Real-time clerk absence detection and unattended customer queue alerting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {mockCashierDesks.map((desk) => {
                const isAbsent = desk.status === 'unattended';
                return (
                  <div
                    key={desk.id}
                    className={`bg-slate-900/60 border rounded-xl p-5 flex flex-col justify-between transition ${
                      isAbsent
                        ? 'border-rose-500/50 shadow-lg shadow-rose-500/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400">{desk.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          isAbsent
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAbsent ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                          {isAbsent ? 'UNATTENDED' : 'OCCUPIED'}
                        </span>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Assigned Clerk:</span>
                          <strong className="text-white font-medium">{desk.operator}</strong>
                        </div>

                        {isAbsent ? (
                          <div className="bg-rose-950/40 border border-rose-800/40 rounded-lg p-3 text-xs space-y-1.5 mt-3">
                            <div className="flex items-center justify-between text-rose-300 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-rose-400" /> Unattended For:
                              </span>
                              <span className="font-mono">{desk.absentDurationSec}s</span>
                            </div>
                            {desk.customerWaiting && (
                              <div className="text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3 h-3" /> Customer waiting ({desk.customerWaitingDurationSec}s)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-800/40 rounded-lg p-3 text-xs space-y-1 mt-3">
                            <div className="flex items-center justify-between text-slate-300">
                              <span>Current Shift Time:</span>
                              <span className="font-mono text-white">{desk.occupiedDurationMin} mins</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Visitors Served Today:</span>
                              <span className="font-mono text-emerald-400 font-semibold">{desk.customerCountToday}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Threshold: 300s</span>
                      <button className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
                        View Cam Stream →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RESTAURANT HEADCOUNT */}
        {/* ========================================================================= */}
        {activeTab === 'restaurant_counter' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Restaurant Capacity & Turnstile Analytics</h2>
              <p className="text-xs text-slate-400">Real-time dining room headcount (YOLO26 PolygonZone) and in/out turnstile flow</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Capacity Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Safari Terrace Restaurant</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      NEAR LIMIT
                    </span>
                  </div>

                  <div className="text-center my-6">
                    <div className="text-5xl font-black text-white font-mono tracking-tight">
                      {summary.restaurantCurrentOccupancy}
                      <span className="text-2xl text-slate-500 font-normal"> / {summary.restaurantMaxCapacity}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Current Occupancy: 92% of fire marshal limit</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(summary.restaurantCurrentOccupancy / summary.restaurantMaxCapacity) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                    <span>0</span>
                    <span>Warning: 40</span>
                    <span>Max: 50</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-800/40 p-2.5 rounded-lg text-center">
                    <div className="text-slate-400">Total Diners In</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">312</div>
                  </div>
                  <div className="bg-slate-800/40 p-2.5 rounded-lg text-center">
                    <div className="text-slate-400">Total Diners Out</div>
                    <div className="text-lg font-bold text-blue-400 mt-0.5">266</div>
                  </div>
                </div>
              </div>

              {/* Hourly Diners Chart */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-1">Dining Room Traffic Curve</h3>
                <p className="text-xs text-slate-400 mb-4">Turnstile throughput per hour</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="restaurantIn" name="Entered" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="restaurantOut" name="Exited" stroke="#38bdf8" strokeWidth={2} fill="#38bdf8" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HORSE RIDING REVENUE AUDIT */}
        {/* ========================================================================= */}
        {activeTab === 'horse_riding' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Horse Riding Revenue Assurance</h2>
              <p className="text-xs text-slate-400">Choke-point computer vision audit cross-referenced against POS ticketing records</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <span className="text-xs text-slate-400">CV Automated Headcount</span>
                <div className="text-3xl font-extrabold text-white mt-1">{summary.horseRidersAudited}</div>
                <p className="text-xs text-emerald-400 mt-1">Staff handlers filtered automatically</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <span className="text-xs text-slate-400">POS Ticketing System Sales</span>
                <div className="text-3xl font-extrabold text-white mt-1">{summary.horsePosTicketsSold}</div>
                <p className="text-xs text-slate-400 mt-1">Synced via POS gateway API</p>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-5">
                <span className="text-xs text-amber-300 font-medium">Reconciliation Variance</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-1">+{summary.horseReconciliationVariance}</div>
                <p className="text-xs text-amber-300/80 mt-1">2 unbilled riders flagged for audit</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Mount Choke-Point Departure Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Time</th>
                      <th className="py-2.5 px-4 font-medium">Track ID</th>
                      <th className="py-2.5 px-4 font-medium">Choke Direction</th>
                      <th className="py-2.5 px-4 font-medium">Handler Filtered</th>
                      <th className="py-2.5 px-4 font-medium">Nx Bookmark Tag</th>
                      <th className="py-2.5 px-4 font-medium">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">09:21:05</td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">#18</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">DEPARTURE</span></td>
                      <td className="py-3 px-4 text-emerald-400">Yes (Handler on foot ignored)</td>
                      <td className="py-3 px-4 font-mono text-slate-400">#ride_audit</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">Reconciled</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">09:14:32</td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">#17</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">DEPARTURE</span></td>
                      <td className="py-3 px-4 text-emerald-400">Yes</td>
                      <td className="py-3 px-4 font-mono text-slate-400">#ride_audit</td>
                      <td className="py-3 px-4 text-amber-400 font-medium">Unmatched POS Ticket</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: FEEDING HAZARD ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'feeding_hazard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Feeding Station Hazard Alert Center</h2>
              <p className="text-xs text-slate-400">Detection of prohibited items (plastic bags / kresek, wrappers, pastry) in animal feeding zones</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Hazard Incident Queue</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  1 Unresolved
                </span>
              </div>

              <div className="divide-y divide-slate-800/60">
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-rose-950/20">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 mt-1">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Giraffe Feeding Deck (Cam #feed-01)</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500 text-white uppercase">
                          CRITICAL
                        </span>
                      </div>
                      <p className="text-xs text-rose-300 mt-1">
                        Detected Item: <strong className="text-white underline">plastic_bag_kresek</strong> (Confidence: 94%)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Zone: visitor_reach_zone • 09:28:14 AM • Nx Bookmark: #feeding_hazard
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition cursor-pointer">
                      Acknowledge & Dispatch Keeper
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer">
                      Mark False Positive
                    </button>
                  </div>
                </div>

                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 opacity-75">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 mt-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Elephant Platform #2</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-emerald-400">
                          RESOLVED
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Detected Item: <strong>snack_wrapper</strong> (Confidence: 87%)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Resolved by Keeper Agus at 08:45 AM
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">08:42:10 AM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
