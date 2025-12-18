import { BusRealtimeData, BusStatistics } from '../types/realtime.types';
export declare class RealtimeService {
    private busService;
    private gpsService;
    private schoolService;
    constructor();
    getAllBusesRealtimeData(): Promise<BusRealtimeData[]>;
    getBusStatistics(): Promise<BusStatistics>;
    private enrichBusWithRealtimeData;
    private getPositionWithFallback;
    private isGPSDataStale;
    private getAllGPSDataAsMap;
    private getDriverInfo;
    private getRouteInfo;
    private getPassengersFromAttendance;
}
//# sourceMappingURL=realtime.service.d.ts.map