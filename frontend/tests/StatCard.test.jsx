import React from 'react';
import { render, screen } from '@testing-library/react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import StatCard from '../dashboard/StatCard';

describe('StatCard', () => {
  const defaultProps = {
    title: 'Total Companies',
    value: '45',
    icon: BuildingOfficeIcon,
    color: 'blue',
    change: '+2%'
  };

  it('renders with correct title and value', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('+2%')).toBeInTheDocument();
  });

  it('applies correct color classes for blue variant', () => {
    render(<StatCard {...defaultProps} />);
    
    const iconWrapper = screen.getByTestId('stat-card-icon');
    expect(iconWrapper).toHaveClass('bg-blue-500');
  });

  it('applies correct color classes for green variant', () => {
    render(<StatCard {...defaultProps} color="green" />);
    
    const iconWrapper = screen.getByTestId('stat-card-icon');
    expect(iconWrapper).toHaveClass('bg-green-500');
  });

  it('renders without change indicator when change is not provided', () => {
    const propsWithoutChange = { ...defaultProps, change: undefined };
    render(<StatCard {...propsWithoutChange} />);
    
    expect(screen.queryByText('+2%')).not.toBeInTheDocument();
  });
});