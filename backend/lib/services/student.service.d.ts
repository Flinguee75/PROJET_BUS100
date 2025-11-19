import { Student, StudentCreateInput, StudentUpdateInput } from '../types/student.types';
export declare class StudentService {
    private getCollection;
    createStudent(input: StudentCreateInput): Promise<Student>;
    getAllStudents(): Promise<Student[]>;
    getStudentById(studentId: string): Promise<Student | null>;
    getStudentsByParent(parentId: string): Promise<Student[]>;
    getStudentsByBus(busId: string): Promise<Student[]>;
    updateStudent(studentId: string, input: StudentUpdateInput): Promise<Student>;
    deleteStudent(studentId: string): Promise<void>;
    assignToBus(studentId: string, busId: string, routeId: string): Promise<Student>;
    removeFromBus(studentId: string): Promise<Student>;
}
declare const _default: StudentService;
export default _default;
//# sourceMappingURL=student.service.d.ts.map