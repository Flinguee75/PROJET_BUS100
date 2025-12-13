import { Request, Response } from 'express';
export declare class SchoolController {
    createSchool(req: Request, res: Response): Promise<void>;
    getSchoolById(req: Request, res: Response): Promise<void>;
    getAllSchools(_req: Request, res: Response): Promise<void>;
    updateSchool(req: Request, res: Response): Promise<void>;
    deleteSchool(req: Request, res: Response): Promise<void>;
    getSchoolFleet(req: Request, res: Response): Promise<void>;
}
declare const _default: SchoolController;
export default _default;
//# sourceMappingURL=school.controller.d.ts.map