import { School, SchoolCreateInput, SchoolUpdateInput } from '../types/school.types';
export declare class SchoolService {
    private getCollection;
    private getBusesCollection;
    createSchool(data: SchoolCreateInput): Promise<School>;
    getSchoolById(schoolId: string): Promise<School | null>;
    getAllSchools(): Promise<School[]>;
    updateSchool(schoolId: string, data: SchoolUpdateInput): Promise<School>;
    deleteSchool(schoolId: string): Promise<void>;
    getSchoolFleetCount(schoolId: string): Promise<number>;
    updateFleetSize(schoolId: string): Promise<void>;
    private mapFirestoreToSchool;
}
declare const _default: SchoolService;
export default _default;
//# sourceMappingURL=school.service.d.ts.map