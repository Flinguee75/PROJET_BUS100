import { Bus, BusCreateInput, BusUpdateInput } from '../types/bus.types';
export declare class BusService {
    private getCollection;
    createBus(input: BusCreateInput): Promise<Bus>;
    getAllBuses(): Promise<Bus[]>;
    getBusById(busId: string): Promise<Bus | null>;
    updateBus(busId: string, input: BusUpdateInput): Promise<Bus>;
    deleteBus(busId: string): Promise<void>;
    getBusesWithLivePosition(): Promise<Bus[]>;
}
declare const _default: BusService;
export default _default;
//# sourceMappingURL=bus.service.d.ts.map