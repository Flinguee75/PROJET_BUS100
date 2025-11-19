export interface DashboardStats {
    busActifs: number;
    busTotaux: number;
    elevesTransportes: number;
    busEnRetard: number;
    totalTrajets: number;
    alertesMaintenance: number;
    retardsCritiques: number;
    retardsGraves: number;
    busImmobilises: number;
    busDisponibles: number;
    tauxValidation: number;
    elevesNonScannes: number;
    busEnRoute: number;
    busArrives: number;
    busNonPartis: number;
    busEnAttente: number;
    retardMoyen: number;
    tauxPonctualite: number;
    tempsTrajetMoyen: number;
    tempsTrajetPrevu: number;
}
export declare class DashboardService {
    getDashboardStats(): Promise<DashboardStats>;
    private getDefaultStats;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboard.service.d.ts.map