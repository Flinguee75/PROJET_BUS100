import { Driver } from '../types/user.types';
export interface DriverCreateInput {
    email: string;
    displayName: string;
    phoneNumber: string;
    licenseNumber: string;
    licenseExpiry: Date | string;
    photoUrl?: string;
}
export interface DriverUpdateInput {
    displayName?: string;
    phoneNumber?: string;
    licenseNumber?: string;
    licenseExpiry?: Date | string;
    busId?: string | null;
    photoUrl?: string;
    isActive?: boolean;
}
export declare class DriverService {
    private getCollection;
    createDriver(input: DriverCreateInput): Promise<Driver>;
    getAllDrivers(): Promise<Driver[]>;
    getDriverById(driverId: string): Promise<Driver | null>;
    getDriverByBus(busId: string): Promise<Driver | null>;
    getAvailableDrivers(): Promise<Driver[]>;
    updateDriver(driverId: string, input: DriverUpdateInput): Promise<Driver>;
    deleteDriver(driverId: string): Promise<void>;
    assignToBus(driverId: string, busId: string): Promise<Driver>;
    removeFromBus(driverId: string): Promise<Driver>;
    isLicenseExpired(driverId: string): Promise<boolean>;
    getDriversWithExpiredLicense(): Promise<Driver[]>;
}
declare const _default: DriverService;
export default _default;
//# sourceMappingURL=driver.service.d.ts.map