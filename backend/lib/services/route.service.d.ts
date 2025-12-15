export interface RouteStudent {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    grade: string;
    scanned: boolean;
    morningStatus?: 'present' | 'absent' | 'late' | 'excused';
    eveningStatus?: 'present' | 'absent' | 'late' | 'excused';
}
export declare class RouteService {
    startRoute(busId: string, driverId: string): Promise<void>;
    getRouteStudents(busId: string, date: string): Promise<RouteStudent[]>;
}
declare const _default: RouteService;
export default _default;
//# sourceMappingURL=route.service.d.ts.map