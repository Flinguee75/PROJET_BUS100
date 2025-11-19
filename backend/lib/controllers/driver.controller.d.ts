import { Request, Response } from 'express';
export declare class DriverController {
    getAllDrivers(_req: Request, res: Response): Promise<void>;
    getDriverById(req: Request, res: Response): Promise<void>;
    getDriverByBus(req: Request, res: Response): Promise<void>;
    getExpiredLicenses(_req: Request, res: Response): Promise<void>;
    createDriver(req: Request, res: Response): Promise<void>;
    updateDriver(req: Request, res: Response): Promise<void>;
    deleteDriver(req: Request, res: Response): Promise<void>;
    assignToBus(req: Request, res: Response): Promise<void>;
    removeFromBus(req: Request, res: Response): Promise<void>;
}
declare const _default: DriverController;
export default _default;
//# sourceMappingURL=driver.controller.d.ts.map