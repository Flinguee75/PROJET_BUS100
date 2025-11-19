/**
 * Tests for Badge Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge label="Test Badge" />);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders with success variant', () => {
    const { container } = render(<Badge label="Success" variant="success" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-success-50');
    expect(badge).toHaveClass('text-success-700');
    expect(badge).toHaveClass('border-success-200');
  });

  it('renders with warning variant', () => {
    const { container } = render(<Badge label="Warning" variant="warning" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-warning-50');
    expect(badge).toHaveClass('text-warning-700');
    expect(badge).toHaveClass('border-warning-200');
  });

  it('renders with danger variant', () => {
    const { container } = render(<Badge label="Danger" variant="danger" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-danger-50');
    expect(badge).toHaveClass('text-danger-700');
    expect(badge).toHaveClass('border-danger-200');
  });

  it('renders with primary variant', () => {
    const { container } = render(<Badge label="Primary" variant="primary" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-primary-50');
    expect(badge).toHaveClass('text-primary-700');
    expect(badge).toHaveClass('border-primary-200');
  });

  it('renders with slate variant (default)', () => {
    const { container } = render(<Badge label="Slate" variant="slate" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-slate-100');
    expect(badge).toHaveClass('text-slate-700');
    expect(badge).toHaveClass('border-slate-200');
  });

  it('renders with info variant', () => {
    const { container } = render(<Badge label="Info" variant="info" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-sky-50');
    expect(badge).toHaveClass('text-sky-700');
    expect(badge).toHaveClass('border-sky-200');
  });

  it('renders with small size', () => {
    const { container } = render(<Badge label="Small" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with medium size (default)', () => {
    const { container } = render(<Badge label="Medium" size="md" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with large size', () => {
    const { container } = render(<Badge label="Large" size="lg" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
    expect(badge).toHaveClass('text-sm');
  });

  it('has correct base classes', () => {
    const { container } = render(<Badge label="Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('rounded-md');
    expect(badge).toHaveClass('font-semibold');
    expect(badge).toHaveClass('border');
  });

  it('renders different labels correctly', () => {
    const { rerender } = render(<Badge label="First" />);
    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(<Badge label="Second" />);
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  it('combines variant and size props correctly', () => {
    const { container } = render(
      <Badge label="Combined" variant="success" size="lg" />
    );
    const badge = container.firstChild as HTMLElement;

    // Variant classes
    expect(badge).toHaveClass('bg-success-50');
    expect(badge).toHaveClass('text-success-700');

    // Size classes
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
    expect(badge).toHaveClass('text-sm');
  });
});
