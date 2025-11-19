import { Request, Response } from 'express';
export declare class MaintenanceController {
    createMaintenance(req: Request, res: Response): Promise<void>;
    getAllMaintenances(req: Request, res: Response): Promise<void>;
    getActiveMaintenances(_req: Request, res: Response): Promise<void>;
    getMaintenanceById(req: Request, res: Response): Promise<void>;
    updateMaintenance(req: Request, res: Response): Promise<void>;
    deleteMaintenance(req: Request, res: Response): Promise<void>;
    getMaintenancesByBusId(req: Request, res: Response): Promise<void>;
}
declare const _default: MaintenanceController;
export default _default;
//# sourceMappingURL=maintenance.controller.d.ts.map