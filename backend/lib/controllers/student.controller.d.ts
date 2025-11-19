import { Request, Response } from 'express';
export declare class StudentController {
    getAllStudents(req: Request, res: Response): Promise<void>;
    getStudentById(req: Request, res: Response): Promise<void>;
    createStudent(req: Request, res: Response): Promise<void>;
    updateStudent(req: Request, res: Response): Promise<void>;
    deleteStudent(req: Request, res: Response): Promise<void>;
    assignToBus(req: Request, res: Response): Promise<void>;
    removeFromBus(req: Request, res: Response): Promise<void>;
}
declare const _default: StudentController;
export default _default;
//# sourceMappingURL=student.controller.d.ts.map