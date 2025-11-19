/**
 * Tests for StatCard Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/StatCard';
import { Users, Bus, TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('renders with basic props', () => {
    render(
      <StatCard
        title="Total Users"
        value={150}
        icon={Users}
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(
      <StatCard
        title="Status"
        value="Active"
        icon={Users}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(
      <StatCard
        title="Total Buses"
        value={25}
        icon={Bus}
        subtitle="Currently in operation"
      />
    );

    expect(screen.getByText('Currently in operation')).toBeInTheDocument();
  });

  it('renders with badge', () => {
    render(
      <StatCard
        title="Active Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Online',
          variant: 'success',
        }}
      />
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders badge with success variant styling', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Success',
          variant: 'success',
        }}
      />
    );

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-success-50');
    expect(badge).toHaveClass('text-success-700');
    expect(badge).toHaveClass('border-success-200');
  });

  it('renders badge with warning variant styling', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Warning',
          variant: 'warning',
        }}
      />
    );

    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-warning-50');
    expect(badge).toHaveClass('text-warning-700');
    expect(badge).toHaveClass('border-warning-200');
  });

  it('renders badge with danger variant styling', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Danger',
          variant: 'danger',
        }}
      />
    );

    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-danger-50');
    expect(badge).toHaveClass('text-danger-700');
    expect(badge).toHaveClass('border-danger-200');
  });

  it('renders badge with primary variant styling', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Primary',
          variant: 'primary',
        }}
      />
    );

    const badge = screen.getByText('Primary');
    expect(badge).toHaveClass('bg-primary-50');
    expect(badge).toHaveClass('text-primary-700');
    expect(badge).toHaveClass('border-primary-200');
  });

  it('renders badge with slate variant styling', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        badge={{
          label: 'Slate',
          variant: 'slate',
        }}
      />
    );

    const badge = screen.getByText('Slate');
    expect(badge).toHaveClass('bg-slate-100');
    expect(badge).toHaveClass('text-slate-700');
    expect(badge).toHaveClass('border-slate-200');
  });

  it('renders with positive trend', () => {
    render(
      <StatCard
        title="Sales"
        value={500}
        icon={TrendingUp}
        trend={{
          value: 15,
          isPositive: true,
        }}
      />
    );

    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. hier/)).toBeInTheDocument();
  });

  it('renders with negative trend', () => {
    render(
      <StatCard
        title="Sales"
        value={500}
        icon={TrendingUp}
        trend={{
          value: 10,
          isPositive: false,
        }}
      />
    );

    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });

  it('applies positive trend styling', () => {
    render(
      <StatCard
        title="Sales"
        value={500}
        icon={TrendingUp}
        trend={{
          value: 15,
          isPositive: true,
        }}
      />
    );

    const trendElement = screen.getByText(/15%/);
    expect(trendElement).toHaveClass('text-success-600');
  });

  it('applies negative trend styling', () => {
    render(
      <StatCard
        title="Sales"
        value={500}
        icon={TrendingUp}
        trend={{
          value: 10,
          isPositive: false,
        }}
      />
    );

    const trendElement = screen.getByText(/10%/);
    expect(trendElement).toHaveClass('text-danger-600');
  });

  it('renders with primary icon color (default)', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
      />
    );

    const iconContainer = container.querySelector('.bg-primary-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-primary-600');
  });

  it('renders with success icon color', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        iconColor="success"
      />
    );

    const iconContainer = container.querySelector('.bg-success-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-success-600');
  });

  it('renders with warning icon color', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        iconColor="warning"
      />
    );

    const iconContainer = container.querySelector('.bg-warning-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-warning-600');
  });

  it('renders with danger icon color', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        iconColor="danger"
      />
    );

    const iconContainer = container.querySelector('.bg-danger-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-danger-600');
  });

  it('renders with slate icon color', () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        iconColor="slate"
      />
    );

    const iconContainer = container.querySelector('.bg-slate-100');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-slate-700');
  });

  it('has correct card container classes', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={100}
        icon={Users}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('shadow-card');
    expect(card).toHaveClass('hover:shadow-card-hover');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-slate-200/60');
  });

  it('renders all props together correctly', () => {
    render(
      <StatCard
        title="Total Revenue"
        value="$50,000"
        icon={TrendingUp}
        subtitle="Last 30 days"
        badge={{
          label: 'Growing',
          variant: 'success',
        }}
        iconColor="success"
        trend={{
          value: 25,
          isPositive: true,
        }}
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Growing')).toBeInTheDocument();
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. hier/)).toBeInTheDocument();
  });

  it('displays up arrow for positive trend', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        trend={{
          value: 10,
          isPositive: true,
        }}
      />
    );

    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('displays down arrow for negative trend', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon={Users}
        trend={{
          value: 10,
          isPositive: false,
        }}
      />
    );

    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });
});
