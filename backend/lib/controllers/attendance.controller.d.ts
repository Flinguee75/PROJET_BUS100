import { Request, Response } from 'express';
export declare class AttendanceController {
    boardStudent(req: Request, res: Response): Promise<void>;
    exitStudent(req: Request, res: Response): Promise<void>;
    getStudentAttendance(req: Request, res: Response): Promise<void>;
    getStudentsOnBus(req: Request, res: Response): Promise<void>;
    getBusAttendanceHistory(req: Request, res: Response): Promise<void>;
    getStudentAttendanceHistory(req: Request, res: Response): Promise<void>;
    countStudentsOnBus(req: Request, res: Response): Promise<void>;
}
declare const _default: AttendanceController;
export default _default;
//# sourceMappingURL=attendance.controller.d.ts.map