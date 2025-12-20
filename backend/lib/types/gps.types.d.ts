export interface GPSPosition {
    lat: number;
    lng: number;
    speed: number;
    heading?: number;
    accuracy?: number;
    timestamp: number;
}
export interface GPSLiveData {
    busId: string;
    position: GPSPosition;
    driverId: string;
    routeId: string | null;
    status: BusLiveStatus;
    passengersCount: number;
    lastUpdate: Date;
}
export declare enum BusLiveStatus {
    IDLE = "idle",
    EN_ROUTE = "en_route",
    STOPPED = "stopped",
    DELAYED = "delayed",
    ARRIVED = "arrived"
}
export interface GPSHistoryEntry {
    busId: string;
    position: GPSPosition;
    timestamp: Date;
    eventType?: GPSEventType;
}
export declare enum GPSEventType {
    DEPARTURE = "departure",
    ARRIVAL = "arrival",
    STOP = "stop",
    ROUTE_DEVIATION = "route_deviation"
}
export interface GPSUpdateInput {
    busId: string;
    lat: number;
    lng: number;
    speed: number;
    heading?: number;
    accuracy?: number;
    timestamp: number;
    arrived?: boolean;
}
export interface GPSHistoryQuery {
    busId: string;
    startDate: Date;
    endDate: Date;
}
//# sourceMappingURL=gps.types.d.ts.map