import { NextRequest, NextResponse } from 'next/server';
import { mockRecentEvents, initialSummary } from '@/lib/mockData';
import { AnalyticsEvent } from '@/types/analytics';

// In-memory telemetry buffer for demonstration & local edge operation
let eventStore: AnalyticsEvent[] = [...mockRecentEvents];
let currentSummary = { ...initialSummary };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const useCase = searchParams.get('useCase');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = eventStore;
  if (useCase && useCase !== 'all') {
    filtered = filtered.filter(e => e.useCase === useCase);
  }

  return NextResponse.json({
    success: true,
    summary: currentSummary,
    totalEvents: filtered.length,
    events: filtered.slice(0, limit)
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming: AnalyticsEvent[] = Array.isArray(body.events) ? body.events : [body];

    if (!incoming.length) {
      return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
    }

    for (const ev of incoming) {
      // Prepend to event store (latest first)
      eventStore.unshift(ev);
      if (eventStore.length > 500) {
        eventStore.pop();
      }

      // Update in-memory aggregate metrics based on event useCase
      if (ev.useCase === 'vehicle_gate' && ev.data) {
        const d = ev.data as any;
        if (d.direction === 'ENTRY') currentSummary.vehiclesIn += 1;
        if (d.direction === 'EXIT') currentSummary.vehiclesOut += 1;
        currentSummary.totalVehiclesToday = currentSummary.vehiclesIn + currentSummary.vehiclesOut;
      } else if (ev.useCase === 'restaurant_counter' && ev.data) {
        const d = ev.data as any;
        currentSummary.restaurantCurrentOccupancy = d.currentOccupancy ?? currentSummary.restaurantCurrentOccupancy;
        currentSummary.restaurantStatus = d.status ?? currentSummary.restaurantStatus;
      } else if (ev.useCase === 'horse_riding' && ev.data) {
        const d = ev.data as any;
        currentSummary.horseRidersAudited = d.dailyCumulativeRiders ?? (currentSummary.horseRidersAudited + 1);
        currentSummary.horseReconciliationVariance = currentSummary.horseRidersAudited - currentSummary.horsePosTicketsSold;
      } else if (ev.useCase === 'feeding_hazard' && ev.data) {
        currentSummary.feedingHazardsToday += 1;
        if (ev.severity === 'critical') currentSummary.activeHazardsUnresolved += 1;
      }
    }

    return NextResponse.json({
      success: true,
      ingestedCount: incoming.length,
      currentTotal: eventStore.length
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to ingest event'
    }, { status: 500 });
  }
}
