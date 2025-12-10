
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../pages/DashboardPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock des composants enfants pour simplifier le test
vi.mock('@/components/Header', () => ({
    Header: () => <div data-testid="header">Header</div>
}));
vi.mock('@/components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading">Loading...</div>
}));
vi.mock('@/components/ErrorMessage', () => ({
    ErrorMessage: () => <div data-testid="error">Error</div>
}));

// Mock useQuery
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: (options: any) => mockUseQuery(options),
    };
});

// Mock des services
vi.mock('@/services/gps.api', () => ({
    getDashboardStats: vi.fn(),
    getAllBuses: vi.fn(),
}));

describe('DashboardPage Defensive Checks', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('ne plante pas si buses est undefined', () => {
        // Mock pour stats
        mockUseQuery.mockImplementation((options) => {
            if (options.queryKey[0] === 'dashboard-stats') {
                return { data: {}, isLoading: false };
            }
            if (options.queryKey[0] === 'all-buses') {
                return { data: undefined, isLoading: false };
            }
            return { data: undefined, isLoading: false };
        });

        expect(() => renderComponent()).not.toThrow();
    });

    it('ne plante pas si buses est un objet (réponse API mal formatée)', () => {
        // Mock pour stats
        mockUseQuery.mockImplementation((options) => {
            if (options.queryKey[0] === 'dashboard-stats') {
                return { data: {}, isLoading: false };
            }
            if (options.queryKey[0] === 'all-buses') {
                // Simulation du bug: buses est un objet au lieu d'un tableau
                return { data: { success: true, data: [] }, isLoading: false };
            }
            return { data: undefined, isLoading: false };
        });

        expect(() => renderComponent()).not.toThrow();
    });

    it('ne plante pas si buses est null', () => {
        // Mock pour stats
        mockUseQuery.mockImplementation((options) => {
            if (options.queryKey[0] === 'dashboard-stats') {
                return { data: {}, isLoading: false };
            }
            if (options.queryKey[0] === 'all-buses') {
                return { data: null, isLoading: false };
            }
            return { data: undefined, isLoading: false };
        });

        expect(() => renderComponent()).not.toThrow();
    });
});
