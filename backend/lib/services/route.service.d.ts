import { Route, RouteCreateInput, RouteUpdateInput, CommuneAbidjan } from '../types/route.types';
export declare class RouteService {
    private getCollection;
    private generateStopIds;
    createRoute(input: RouteCreateInput): Promise<Route>;
    getAllRoutes(): Promise<Route[]>;
    getRouteById(routeId: string): Promise<Route | null>;
    getRoutesByCommune(commune: CommuneAbidjan): Promise<Route[]>;
    getRoutesByQuartier(quartier: string): Promise<Route[]>;
    getActiveRoutes(): Promise<Route[]>;
    getAvailableRoutes(): Promise<Route[]>;
    updateRoute(routeId: string, input: RouteUpdateInput): Promise<Route>;
    deleteRoute(routeId: string): Promise<void>;
    assignBus(routeId: string, busId: string): Promise<Route>;
    removeBus(routeId: string): Promise<Route>;
    assignDriver(routeId: string, driverId: string): Promise<Route>;
    removeDriver(routeId: string): Promise<Route>;
    updateOccupancy(routeId: string, occupancy: number): Promise<Route>;
    incrementOccupancy(routeId: string): Promise<Route>;
    decrementOccupancy(routeId: string): Promise<Route>;
}
declare const _default: RouteService;
export default _default;
//# sourceMappingURL=route.service.d.ts.map