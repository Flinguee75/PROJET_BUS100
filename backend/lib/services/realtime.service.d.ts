import { BusRealtimeData, BusStatistics } from '../types/realtime.types';
export declare class RealtimeService {
    private zones;
    getAllBusesRealtime(): Promise<BusRealtimeData[]>;
    getBusStatistics(): Promise<BusStatistics>;
    private determineZone;
    getBusRealtime(busId: string): Promise<BusRealtimeData | null>;
}
declare const _default: RealtimeService;
export default _default;
//# sourceMappingURL=realtime.service.d.ts.map