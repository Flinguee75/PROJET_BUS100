export interface DashboardStats {
    busActifs: number;
    busTotaux: number;
    elevesTransportes: number;
    busEnRetard: number;
    totalTrajets: number;
    alertesMaintenance: number;
}
export declare class DashboardService {
    getDashboardStats(): Promise<DashboardStats>;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboard.service.d.ts.map