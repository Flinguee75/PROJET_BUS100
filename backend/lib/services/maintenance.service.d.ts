import { Maintenance, MaintenanceCreateInput, MaintenanceUpdateInput, MaintenanceFilter } from '../types/maintenance.types';
export declare class MaintenanceService {
    private getCollection;
    createMaintenance(input: MaintenanceCreateInput): Promise<Maintenance>;
    getAllMaintenances(filter?: MaintenanceFilter): Promise<Maintenance[]>;
    getMaintenanceById(maintenanceId: string): Promise<Maintenance | null>;
    updateMaintenance(maintenanceId: string, input: MaintenanceUpdateInput): Promise<Maintenance>;
    deleteMaintenance(maintenanceId: string): Promise<void>;
    getMaintenancesByBusId(busId: string): Promise<Maintenance[]>;
    getActiveMaintenances(): Promise<Maintenance[]>;
}
declare const _default: MaintenanceService;
export default _default;
//# sourceMappingURL=maintenance.service.d.ts.map