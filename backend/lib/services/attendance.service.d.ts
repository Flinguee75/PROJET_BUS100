export interface ScanStudentInput {
    studentId: string;
    busId: string;
    date: string;
    type: 'boarding' | 'alighting';
    driverId: string;
    location?: {
        lat: number;
        lng: number;
    };
}
export interface UnscanStudentInput {
    studentId: string;
    busId: string;
    date: string;
    driverId: string;
}
export declare class AttendanceService {
    private getTimeOfDay;
    scanStudent(data: ScanStudentInput): Promise<void>;
    unscanStudent(data: UnscanStudentInput): Promise<void>;
}
declare const _default: AttendanceService;
export default _default;
//# sourceMappingURL=attendance.service.d.ts.map