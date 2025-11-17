import { Request, Response } from 'express';
export declare class GPSController {
    updatePosition(req: Request, res: Response): Promise<void>;
    getLivePosition(req: Request, res: Response): Promise<void>;
    getAllLivePositions(_req: Request, res: Response): Promise<void>;
    getHistory(req: Request, res: Response): Promise<void>;
    calculateETA(req: Request, res: Response): Promise<void>;
}
declare const _default: GPSController;
export default _default;
//# sourceMappingURL=gps.controller.d.ts.map