export interface School {
    id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    fleetSize: number;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface SchoolCreateInput {
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    fleetSize?: number;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
}
export interface SchoolUpdateInput {
    name?: string;
    location?: {
        lat: number;
        lng: number;
    };
    fleetSize?: number;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
}
//# sourceMappingURL=school.types.d.ts.map