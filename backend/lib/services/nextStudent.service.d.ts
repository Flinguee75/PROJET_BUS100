export interface NextStudentInfo {
    studentId: string;
    studentName: string;
    stopOrder: number;
}
export declare class NextStudentService {
    getNextStudentToPickup(busId: string): Promise<NextStudentInfo | null>;
}
declare const _default: NextStudentService;
export default _default;
//# sourceMappingURL=nextStudent.service.d.ts.map