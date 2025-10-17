import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, collectionAPI, wasteBinAPI, userAPI } from '../../utils/api';
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  PresentationChartBarIcon,
  TruckIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { BarChart3, TrendingUp, PieChart, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {},
    collections: {},
    wasteBins: {},
    users: {}
  });
  const [reportType, setReportType] = useState('weekly');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [collectionsData, binsData, usersData] = await Promise.all([
        collectionAPI.getCollectionStats(),
        wasteBinAPI.getBinStats(),
        userAPI.getUserStats()
      ]);

      setAnalytics({
        collections: collectionsData.data,
        wasteBins: binsData.data,
        users: usersData.data
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      const reportData = {
        type: reportType,
        dateRange: dateRange.startDate && dateRange.endDate ? dateRange : null,
        includeCharts: true
      };

      const response = await analyticsAPI.generateReport(reportData);
      
      // Create download link for the report
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `waste-management-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report generated and downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const { collections, wasteBins, users } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive waste management insights and reporting</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="yearly">Yearly Report</option>
            </select>
            
            <button
              onClick={generateReport}
              disabled={generatingReport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
            >
              {generatingReport ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <DocumentArrowDownIcon className="h-5 w-5" />
              )}
              <span>{generatingReport ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Collections</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {collections?.overview?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowPathIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Bins</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteBins?.overview?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users?.overview?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Efficiency Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {collections?.overview?.efficiency || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Status Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Collection Status Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {collections?.byStatus?.map((item, index) => (
                <div key={item._id || index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      item._id === 'completed' ? 'bg-green-400' :
                      item._id === 'in_progress' ? 'bg-blue-400' :
                      item._id === 'scheduled' ? 'bg-yellow-400' :
                      item._id === 'missed' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item._id?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Waste Type Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-gray-400" />
              Waste Type Distribution
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {collections?.byWasteType?.map((item, index) => (
                <div key={item._id || index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      item._id === 'general' ? 'bg-gray-400' :
                      item._id === 'recyclable' ? 'bg-green-400' :
                      item._id === 'organic' ? 'bg-brown-400' :
                      item._id === 'hazardous' ? 'bg-red-400' :
                      item._id === 'electronic' ? 'bg-blue-400' : 'bg-purple-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item._id || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{item.count} collections</div>
                    <div className="text-xs text-gray-500">
                      {item.totalWeight ? `${item.totalWeight.toFixed(1)} kg` : '0 kg'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Performance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Collection Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed Today</span>
                <span className="text-sm font-medium">{collections?.overview?.today || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Completed</span>
                <span className="text-sm font-medium">{collections?.overview?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Missed Collections</span>
                <span className="text-sm font-medium text-red-600">{collections?.overview?.missed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {collections?.overview?.efficiency || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bin Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bin Management</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Bins</span>
                <span className="text-sm font-medium">{wasteBins?.overview?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Bins</span>
                <span className="text-sm font-medium text-green-600">{wasteBins?.overview?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Full Bins</span>
                <span className="text-sm font-medium text-red-600">{wasteBins?.overview?.full || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Maintenance Required</span>
                <span className="text-sm font-medium text-orange-600">{wasteBins?.overview?.maintenance || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-sm font-medium">{users?.overview?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-sm font-medium text-green-600">{users?.overview?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New This Month</span>
                <span className="text-sm font-medium text-blue-600">{users?.overview?.newThisMonth || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Collectors</span>
                <span className="text-sm font-medium">{users?.overview?.collectors || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-400" />
            Custom Report Generation
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="quarterly">Quarterly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            
            {reportType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={generateReport}
              disabled={generatingReport || (reportType === 'custom' && (!dateRange.startDate || !dateRange.endDate))}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
            >
              {generatingReport ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span>{generatingReport ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;