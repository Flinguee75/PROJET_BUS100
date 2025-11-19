import { Route } from '../types/route.types';
export declare class RouteGenerationService {
    generateRouteForBus(busId: string): Promise<Route>;
    regenerateRoute(busId: string): Promise<Route>;
    previewRoute(busId: string): Promise<Partial<Route>>;
    private optimizeStopsWithMapbox;
    private calculateETAs;
    private getDirectionDuration;
    private buildOptimizedStops;
    private buildGeographicStops;
    private calculateHaversineDistance;
    private toRadians;
    private calculateTotalStats;
    private determineMainCommune;
    private addMinutesToTime;
    private calculateArrivalTime;
    private getRoutesByBus;
}
declare const _default: RouteGenerationService;
export default _default;
//# sourceMappingURL=route-generation.service.d.ts.map