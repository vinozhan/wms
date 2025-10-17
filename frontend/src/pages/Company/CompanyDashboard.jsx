import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import RecentIssues from '../../components/dashboard/RecentIssues';
import CompanyRankings from '../../components/dashboard/CompanyRankings';
import ProgramProgress from '../../components/dashboard/ProgramProgress';
import { 
  BuildingOfficeIcon, 
  DocumentChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { overview, analytics, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading dashboard: {error}</p>
      </div>
    );
  }

  const stats = overview?.stats || {};

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies || 0,
      icon: BuildingOfficeIcon,
      color: 'blue',
      change: '+2%'
    },
    {
      title: 'Active Programs',
      value: stats.activePrograms || 0,
      icon: DocumentChartBarIcon,
      color: 'green',
      change: '+5%'
    },
    {
      title: 'Pending Issues',
      value: stats.pendingIssues || 0,
      icon: ExclamationTriangleIcon,
      color: 'red',
      change: '-3%'
    },
    {
      title: 'Compliance Rate',
      value: `${stats.complianceRate || 0}%`,
      icon: CheckCircleIcon,
      color: 'green',
      change: '+1%'
    },
    {
      title: 'Collection Rate',
      value: `${stats.avgCollectionRate || 0}%`,
      icon: TruckIcon,
      color: 'blue',
      change: '+2%'
    },
    {
      title: 'Waste Collected',
      value: `${(stats.totalWasteCollected || 0).toLocaleString()} tons`,
      icon: ChartBarIcon,
      color: 'purple',
      change: '+8%'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={analytics?.monthlyPerformance} />
        </div>
        
        <div className="space-y-6">
          <RecentIssues issues={overview?.recentIssues} />
          <CompanyRankings rankings={overview?.topRankings} />
        </div>
        
        <div>
          <ProgramProgress programs={analytics?.programProgress} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;