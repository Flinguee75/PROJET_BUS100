export interface BoardingEvent {
    studentId: string;
    busId: string;
    driverId: string;
    timestamp: Date;
    location?: {
        lat: number;
        lng: number;
    };
    type: 'board' | 'exit';
    notes?: string;
}
export interface AttendanceRecord {
    id?: string;
    studentId: string;
    busId: string;
    driverId: string;
    date: string;
    boardingTime?: Date;
    boardingLocation?: {
        lat: number;
        lng: number;
    };
    exitTime?: Date;
    exitLocation?: {
        lat: number;
        lng: number;
    };
    status: 'boarded' | 'completed' | 'absent';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface StudentAttendanceStatus {
    studentId: string;
    studentName: string;
    isOnBus: boolean;
    boardingTime?: Date;
    exitTime?: Date;
}
export declare class AttendanceService {
    boardStudent(event: BoardingEvent): Promise<AttendanceRecord>;
    exitStudent(event: BoardingEvent): Promise<AttendanceRecord>;
    getStudentAttendance(studentId: string, date?: string): Promise<AttendanceRecord | null>;
    getStudentsOnBus(busId: string): Promise<StudentAttendanceStatus[]>;
    getBusAttendanceHistory(busId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]>;
    getStudentAttendanceHistory(studentId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]>;
    countStudentsOnBus(busId: string): Promise<number>;
    private notifyParentsBoarding;
    private getTodayDateString;
}
declare const _default: AttendanceService;
export default _default;
//# sourceMappingURL=attendance.service.d.ts.map