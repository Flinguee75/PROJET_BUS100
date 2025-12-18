import { Request, Response } from 'express';
export declare class RealtimeController {
    private realtimeService;
    constructor();
    getAllBusesRealtime(_req: Request, res: Response): Promise<void>;
    getBusStatistics(_req: Request, res: Response): Promise<void>;
    getBusRealtime(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=realtime.controller.d.ts.map