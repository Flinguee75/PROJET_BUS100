import { Request, Response } from 'express';
export declare class BusController {
    createBus(req: Request, res: Response): Promise<void>;
    getAllBuses(req: Request, res: Response): Promise<void>;
    getBusById(req: Request, res: Response): Promise<void>;
    updateBus(req: Request, res: Response): Promise<void>;
    deleteBus(req: Request, res: Response): Promise<void>;
    getNextStudent(req: Request, res: Response): Promise<void>;
}
declare const _default: BusController;
export default _default;
//# sourceMappingURL=bus.controller.d.ts.map