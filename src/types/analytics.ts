export type UseCaseType = 
  | 'vehicle_gate' 
  | 'cashier_presence' 
  | 'restaurant_counter' 
  | 'horse_riding' 
  | 'feeding_hazard';

export type SeverityType = 'info' | 'warning' | 'critical';

export interface BaseEvent<T = any> {
  eventId: string;
  timestamp: string;
  timestampMs?: number;
  cameraId: string;
  cameraName: string;
  useCase: UseCaseType;
  eventType: string;
  severity: SeverityType;
  nxCameraId?: string;
  data: T;
}

export interface VehicleGateData {
  vehicleType: 'car' | 'motorcycle' | 'bus' | 'truck' | 'vehicle';
  direction: 'ENTRY' | 'EXIT';
  trackerId: number | string;
  licensePlate: string;
  isPlateValid: boolean;
  confidence?: number;
  totalIn: number;
  totalOut: number;
}

export interface CashierPresenceData {
  status: 'occupied' | 'unattended' | 'customer_waiting';
  absentDurationSec: number;
  thresholdSec: number;
  customerWaiting: boolean;
  customerWaitingDurationSec: number;
  shiftOperator?: string;
}

export interface RestaurantOccupancyData {
  mode: 'area_occupancy' | 'tripwire';
  currentOccupancy: number;
  rawOccupancy?: number;
  maxCapacity: number;
  warningCapacity: number;
  occupancyPct: number;
  status: 'NORMAL' | 'NEAR_LIMIT' | 'OVER_CAPACITY';
  inCountToday: number;
  outCountToday: number;
}

export interface HorseRideData {
  trackerId: number | string;
  direction: 'DEPARTURE' | 'RETURN';
  ridersIncrement: number;
  dailyCumulativeRiders: number;
  handlerFiltered: boolean;
  auditTag?: string;
  posTicketsSold?: number;
  variance?: number;
}

export interface FeedingHazardData {
  detectedItem: string;
  isProhibited: boolean;
  confidence: number;
  zoneName: string;
  isResolved?: boolean;
}

export type AnalyticsEvent = 
  | BaseEvent<VehicleGateData>
  | BaseEvent<CashierPresenceData>
  | BaseEvent<RestaurantOccupancyData>
  | BaseEvent<HorseRideData>
  | BaseEvent<FeedingHazardData>;
