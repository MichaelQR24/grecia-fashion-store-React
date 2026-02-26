import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LogoutButton from './LogoutButton';

// Mock contexts and utilities
const mockSetUserRole = vi.fn();
vi.mock('@/context/AppContext', () => ({
    useAppContext: () => ({
        setUserRole: mockSetUserRole,
    }),
}));

const mockSignOut = vi.fn();
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signOut: mockSignOut,
        },
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe('LogoutButton Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });
    });

    it('renders the button correctly', () => {
        render(<LogoutButton />);
        expect(screen.getByText(/Cerrar Sesión Segura/i)).toBeInTheDocument();
    });

    it('calls signOut and setUserRole when clicked', async () => {
        render(<LogoutButton />);
        const button = screen.getByText(/Cerrar Sesión Segura/i);

        fireEvent.click(button);

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
            expect(mockSetUserRole).toHaveBeenCalledWith(null);
            expect(window.location.href).toBe('/');
        });
    });
});
