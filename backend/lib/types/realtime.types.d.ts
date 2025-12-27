import { BusStatus } from './bus.types';
import { GPSPosition, BusLiveStatus } from './gps.types';
export interface DriverInfo {
    id: string;
    name: string;
    phone: string;
}
export interface RouteInfo {
    id: string;
    name: string;
    fromZone: string;
    toZone: string;
}
export interface BusRealtimeData {
    id: string;
    number: string;
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
    status: BusStatus;
    currentPosition: GPSPosition | null;
    liveStatus: BusLiveStatus | null;
    driver: DriverInfo | null;
    route: RouteInfo | null;
    passengersCount: number;
    passengersPresent?: number;
    currentZone: string | null;
    lastUpdate: string | null;
    isActive: boolean;
    schoolId?: string | null;
    tripType?: string | null;
    tripLabel?: string | null;
    tripStartTime?: number | null;
    stoppedAt?: number | null;
}
export interface BusStatistics {
    total: number;
    active: number;
    inactive: number;
    enRoute: number;
    stopped: number;
    totalPassengers: number;
}
//# sourceMappingURL=realtime.types.d.ts.map