/**
 * Tests for EmptyState Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/EmptyState';
import { Users, Plus } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with icon, title, and description', () => {
    render(
      <EmptyState
        icon={Users}
        title="No Users"
        description="Start by adding your first user"
      />
    );

    expect(screen.getByText('No Users')).toBeInTheDocument();
    expect(screen.getByText('Start by adding your first user')).toBeInTheDocument();
  });

  it('renders without action button when no action is provided', () => {
    render(
      <EmptyState
        icon={Users}
        title="No Users"
        description="No users available"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders action button when action is provided', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={Users}
        title="No Users"
        description="No users available"
        action={{
          label: 'Add User',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: /add user/i });
    expect(button).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={Users}
        title="No Users"
        description="No users available"
        action={{
          label: 'Add User',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: /add user/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders action button with icon when provided', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={Users}
        title="No Users"
        description="No users available"
        action={{
          label: 'Add User',
          onClick: mockOnClick,
          icon: Plus,
        }}
      />
    );

    const button = screen.getByRole('button', { name: /add user/i });
    expect(button).toBeInTheDocument();

    // Check that the button contains the label
    expect(button).toHaveTextContent('Add User');
  });

  it('has correct container classes', () => {
    const { container } = render(
      <EmptyState
        icon={Users}
        title="Test"
        description="Test description"
      />
    );

    const emptyStateDiv = container.firstChild as HTMLElement;
    expect(emptyStateDiv).toHaveClass('bg-white');
    expect(emptyStateDiv).toHaveClass('rounded-xl');
    expect(emptyStateDiv).toHaveClass('shadow-card');
    expect(emptyStateDiv).toHaveClass('border');
    expect(emptyStateDiv).toHaveClass('border-slate-200');
  });

  it('renders title with correct styling', () => {
    render(
      <EmptyState
        icon={Users}
        title="Custom Title"
        description="Description"
      />
    );

    const title = screen.getByText('Custom Title');
    expect(title).toHaveClass('text-xl');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-slate-900');
    expect(title).toHaveClass('font-display');
  });

  it('renders description with correct styling', () => {
    render(
      <EmptyState
        icon={Users}
        title="Title"
        description="Custom Description"
      />
    );

    const description = screen.getByText('Custom Description');
    expect(description).toHaveClass('text-slate-600');
  });

  it('renders action button with correct styling', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={Users}
        title="Title"
        description="Description"
        action={{
          label: 'Click Me',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('hover:bg-primary-700');
    expect(button).toHaveClass('font-medium');
  });

  it('can be clicked multiple times', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={Users}
        title="Title"
        description="Description"
        action={{
          label: 'Click Me',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });
});
