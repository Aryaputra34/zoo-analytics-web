import { AnalyticsEvent } from '../types/analytics';

export interface DashboardSummary {
  totalVehiclesToday: number;
  vehiclesIn: number;
  vehiclesOut: number;
  activeCashiers: number;
  totalCashiers: number;
  cashierAlertsActive: number;
  restaurantCurrentOccupancy: number;
  restaurantMaxCapacity: number;
  restaurantStatus: 'NORMAL' | 'NEAR_LIMIT' | 'OVER_CAPACITY';
  horseRidersAudited: number;
  horsePosTicketsSold: number;
  horseReconciliationVariance: number;
  feedingHazardsToday: number;
  activeHazardsUnresolved: number;
}

export const initialSummary: DashboardSummary = {
  totalVehiclesToday: 384,
  vehiclesIn: 246,
  vehiclesOut: 138,
  activeCashiers: 2,
  totalCashiers: 3,
  cashierAlertsActive: 1,
  restaurantCurrentOccupancy: 46,
  restaurantMaxCapacity: 50,
  restaurantStatus: 'NEAR_LIMIT',
  horseRidersAudited: 84,
  horsePosTicketsSold: 82,
  horseReconciliationVariance: 2,
  feedingHazardsToday: 6,
  activeHazardsUnresolved: 1,
};

export const hourlyTrafficData = [
  { hour: '08:00', vehicles: 24, restaurantIn: 12, restaurantOut: 4 },
  { hour: '09:00', vehicles: 45, restaurantIn: 28, restaurantOut: 10 },
  { hour: '10:00', vehicles: 68, restaurantIn: 45, restaurantOut: 18 },
  { hour: '11:00', vehicles: 82, restaurantIn: 62, restaurantOut: 35 },
  { hour: '12:00', vehicles: 74, restaurantIn: 88, restaurantOut: 70 },
  { hour: '13:00', vehicles: 51, restaurantIn: 75, restaurantOut: 82 },
  { hour: '14:00', vehicles: 40, restaurantIn: 54, restaurantOut: 45 },
];

export const vehicleTypeBreakdown = [
  { name: 'Cars', value: 210, color: '#3b82f6' },
  { name: 'Motorcycles', value: 128, color: '#10b981' },
  { name: 'Buses', value: 26, color: '#f59e0b' },
  { name: 'Trucks / Delivery', value: 20, color: '#8b5cf6' },
];

export const mockRecentEvents: AnalyticsEvent[] = [
  {
    eventId: 'evt_001',
    timestamp: '2026-10-01T09:28:14Z',
    cameraId: 'cam-feed-01',
    cameraName: 'Giraffe Feeding Deck',
    useCase: 'feeding_hazard',
    eventType: 'hazard_detected',
    severity: 'critical',
    nxCameraId: '87e32aa1-09cd-4f51-b841-dce230198451',
    data: {
      detectedItem: 'plastic_bag_kresek',
      isProhibited: true,
      confidence: 0.94,
      zoneName: 'visitor_reach_zone',
      isResolved: false
    }
  },
  {
    eventId: 'evt_002',
    timestamp: '2026-10-01T09:27:50Z',
    cameraId: 'cam-resto-01',
    cameraName: 'Safari Terrace Restaurant',
    useCase: 'restaurant_counter',
    eventType: 'occupancy_update',
    severity: 'warning',
    nxCameraId: '488fca99-10b2-4d7a-8921-cc54320b9e84',
    data: {
      mode: 'area_occupancy',
      currentOccupancy: 46,
      rawOccupancy: 48,
      maxCapacity: 50,
      warningCapacity: 40,
      occupancyPct: 92.0,
      status: 'NEAR_LIMIT',
      inCountToday: 312,
      outCountToday: 266
    }
  },
  {
    eventId: 'evt_003',
    timestamp: '2026-10-01T09:26:40Z',
    cameraId: 'cam-gate-01',
    cameraName: 'Main Entrance Gate',
    useCase: 'vehicle_gate',
    eventType: 'vehicle_crossing',
    severity: 'info',
    nxCameraId: 'c928fa10-2b10-449e-bc43-9828d19a4e01',
    data: {
      vehicleType: 'car',
      direction: 'ENTRY',
      trackerId: 104,
      licensePlate: 'B 1892 SAB',
      isPlateValid: true,
      confidence: 0.91,
      totalIn: 246,
      totalOut: 138
    }
  },
  {
    eventId: 'evt_004',
    timestamp: '2026-10-01T09:24:12Z',
    cameraId: 'cam-cashier-02',
    cameraName: 'Ticket Counter #2',
    useCase: 'cashier_presence',
    eventType: 'cashier_unattended',
    severity: 'warning',
    nxCameraId: 'b11a91e4-3c81-4221-a5d2-08f33190ab72',
    data: {
      status: 'unattended',
      absentDurationSec: 340,
      thresholdSec: 300,
      customerWaiting: true,
      customerWaitingDurationSec: 85,
      shiftOperator: 'Budi S.'
    }
  },
  {
    eventId: 'evt_005',
    timestamp: '2026-10-01T09:21:05Z',
    cameraId: 'cam-horse-01',
    cameraName: 'Horse Riding Departure Choke',
    useCase: 'horse_riding',
    eventType: 'ride_departure',
    severity: 'info',
    nxCameraId: '6f2e88a0-281b-4d43-9821-ab9875412fed',
    data: {
      trackerId: 18,
      direction: 'DEPARTURE',
      ridersIncrement: 1,
      dailyCumulativeRiders: 84,
      handlerFiltered: true,
      auditTag: '#ride_audit',
      posTicketsSold: 82,
      variance: 2
    }
  }
];

export const mockCashierDesks = [
  {
    id: 'cam-cashier-01',
    name: 'Ticket Counter #1 (Main)',
    operator: 'Dewi Lestari',
    status: 'occupied',
    occupiedDurationMin: 42,
    customerCountToday: 185,
    customerWaiting: false,
    alertActive: false
  },
  {
    id: 'cam-cashier-02',
    name: 'Ticket Counter #2 (Express)',
    operator: 'Budi Santoso',
    status: 'unattended',
    absentDurationSec: 340,
    customerCountToday: 142,
    customerWaiting: true,
    customerWaitingDurationSec: 85,
    alertActive: true
  },
  {
    id: 'cam-cashier-03',
    name: 'Ticket Counter #3 (VIP / Tour)',
    operator: 'Siti Rahma',
    status: 'occupied',
    occupiedDurationMin: 18,
    customerCountToday: 57,
    customerWaiting: false,
    alertActive: false
  }
];

export const mockVehiclePlates = [
  { id: 1, plate: 'B 1892 SAB', type: 'Car', direction: 'ENTRY', time: '09:26:40', valid: true, conf: 0.91 },
  { id: 2, plate: 'D 1042 KL', type: 'Car', direction: 'ENTRY', time: '09:24:15', valid: true, conf: 0.95 },
  { id: 3, plate: 'B 8831 UJQ', type: 'Motorcycle', direction: 'ENTRY', time: '09:22:30', valid: true, conf: 0.88 },
  { id: 4, plate: 'B 7109 ZAA', type: 'Bus', direction: 'ENTRY', time: '09:18:02', valid: true, conf: 0.93 },
  { id: 5, plate: 'F 4421 CD', type: 'Car', direction: 'EXIT', time: '09:15:44', valid: true, conf: 0.89 },
  { id: 6, plate: 'B 2940 TXY', type: 'Car', direction: 'EXIT', time: '09:12:10', valid: true, conf: 0.92 },
  { id: 7, plate: 'UNIDENTIFIED', type: 'Motorcycle', direction: 'ENTRY', time: '09:08:55', valid: false, conf: 0.42 },
];
