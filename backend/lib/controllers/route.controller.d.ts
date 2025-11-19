import { Request, Response } from 'express';
export declare class RouteController {
    getAllRoutes(req: Request, res: Response): Promise<void>;
    getAvailableRoutes(_req: Request, res: Response): Promise<void>;
    getCommunes(_req: Request, res: Response): Promise<void>;
    getQuartiersByCommune(req: Request, res: Response): Promise<void>;
    getRouteById(req: Request, res: Response): Promise<void>;
    createRoute(req: Request, res: Response): Promise<void>;
    updateRoute(req: Request, res: Response): Promise<void>;
    deleteRoute(req: Request, res: Response): Promise<void>;
    assignBus(req: Request, res: Response): Promise<void>;
    removeBus(req: Request, res: Response): Promise<void>;
    assignDriver(req: Request, res: Response): Promise<void>;
    generateRouteForBus(req: Request, res: Response): Promise<void>;
    regenerateRoute(req: Request, res: Response): Promise<void>;
    getRouteByBus(req: Request, res: Response): Promise<void>;
    previewRoute(req: Request, res: Response): Promise<void>;
}
declare const _default: RouteController;
export default _default;
//# sourceMappingURL=route.controller.d.ts.map