export declare enum TimeOfDay {
    MORNING_OUTBOUND = "morning_outbound",
    MIDDAY_OUTBOUND = "midday_outbound",
    MIDDAY_RETURN = "midday_return",
    EVENING_RETURN = "evening_return"
}
export declare enum CommuneAbidjan {
    COCODY = "Cocody",
    YOPOUGON = "Yopougon",
    ABOBO = "Abobo",
    ADJAME = "Adjam\u00E9",
    PLATEAU = "Plateau",
    MARCORY = "Marcory",
    KOUMASSI = "Koumassi",
    PORT_BOUET = "Port-Bou\u00EBt",
    TREICHVILLE = "Treichville",
    ATTÉCOUBÉ = "Att\u00E9coub\u00E9",
    BINGERVILLE = "Bingerville",
    SONGON = "Songon",
    ANYAMA = "Anyama"
}
export interface RouteStop {
    id: string;
    name: string;
    address: string;
    location: {
        lat: number;
        lng: number;
    };
    order: number;
    estimatedTimeMinutes: number;
    type: 'pickup' | 'dropoff' | 'both';
    quartier: string;
    notes?: string;
    activeTimeSlots: TimeOfDay[];
    studentId?: string;
    estimatedArrivalTime?: string;
    relativeTimeMinutes?: number;
}
export interface Route {
    id: string;
    name: string;
    code: string;
    description?: string;
    commune: CommuneAbidjan;
    quartiers: string[];
    stops: RouteStop[];
    schedule: {
        morningOutbound?: {
            departure: string;
            arrival: string;
        };
        middayOutbound?: {
            departure: string;
            arrival: string;
        };
        middayReturn?: {
            departure: string;
            arrival: string;
        };
        eveningReturn?: {
            departure: string;
            arrival: string;
        };
    };
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
    capacity: number;
    currentOccupancy: number;
    busId: string | null;
    driverId: string | null;
    activeDays: DayOfWeek[];
    isActive: boolean;
    isManual: boolean;
    generatedAt?: Date;
    isOptimized?: boolean;
    optimizationEngine?: string;
    departureTime?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum DayOfWeek {
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday",
    SUNDAY = "sunday"
}
export interface RouteCreateInput {
    name: string;
    code: string;
    description?: string;
    commune: CommuneAbidjan;
    quartiers: string[];
    stops: Omit<RouteStop, 'id'>[];
    schedule: {
        morningOutbound?: {
            departure: string;
            arrival: string;
        };
        middayOutbound?: {
            departure: string;
            arrival: string;
        };
        middayReturn?: {
            departure: string;
            arrival: string;
        };
        eveningReturn?: {
            departure: string;
            arrival: string;
        };
    };
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
    capacity: number;
    activeDays: DayOfWeek[];
    isManual?: boolean;
    departureTime?: string;
}
export interface RouteUpdateInput {
    name?: string;
    code?: string;
    description?: string;
    commune?: CommuneAbidjan;
    quartiers?: string[];
    stops?: Omit<RouteStop, 'id'>[];
    schedule?: {
        morningOutbound?: {
            departure: string;
            arrival: string;
        };
        middayOutbound?: {
            departure: string;
            arrival: string;
        };
        middayReturn?: {
            departure: string;
            arrival: string;
        };
        eveningReturn?: {
            departure: string;
            arrival: string;
        };
    };
    totalDistanceKm?: number;
    estimatedDurationMinutes?: number;
    capacity?: number;
    currentOccupancy?: number;
    busId?: string | null;
    driverId?: string | null;
    activeDays?: DayOfWeek[];
    isActive?: boolean;
    isManual?: boolean;
    departureTime?: string;
}
export declare const QUARTIERS_BY_COMMUNE: Record<CommuneAbidjan, string[]>;
//# sourceMappingURL=route.types.d.ts.map