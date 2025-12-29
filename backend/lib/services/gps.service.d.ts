import { GPSUpdateInput, GPSLiveData, GPSHistoryEntry } from '../types';
export declare class GPSService {
    updateGPSPosition(data: GPSUpdateInput): Promise<GPSLiveData>;
    private enrichGPSDataWithBusInfo;
    private archiveGPSPosition;
    private determineBusStatus;
    getLivePosition(busId: string): Promise<GPSLiveData | null>;
    getAllLivePositions(): Promise<GPSLiveData[]>;
    getHistoryForDay(busId: string, date: Date): Promise<GPSHistoryEntry[]>;
    private checkSchoolArrivalAndNotify;
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
    private toRadians;
    calculateETA(currentLat: number, currentLng: number, destLat: number, destLng: number, currentSpeed: number): number;
}
declare const _default: GPSService;
export default _default;
//# sourceMappingURL=gps.service.d.ts.map