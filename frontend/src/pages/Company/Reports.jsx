import React, { useState } from 'react';
import { 
  DocumentChartBarIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [reportType, setReportType] = useState('performance');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Company performance metrics and rankings',
      icon: ChartBarIcon
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance status and violations',
      icon: DocumentChartBarIcon
    },
    {
      id: 'issues',
      name: 'Issues Report',
      description: 'Reported issues and resolution status',
      icon: DocumentChartBarIcon
    },
    {
      id: 'programs',
      name: 'Programs Report',
      description: 'Waste management program progress and outcomes',
      icon: ChartBarIcon
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Budget utilization and financial performance',
      icon: DocumentChartBarIcon
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Comprehensive analytics and insights',
      icon: ChartBarIcon
    }
  ];

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real application, this would generate and download the report
    alert(`Generated ${reportType} report for ${dateRange.startDate} to ${dateRange.endDate}`);
    
    setGenerating(false);
  };

  const handleExportData = (format) => {
    alert(`Exporting ${reportType} data as ${format.toUpperCase()}`);
  };

  const selectedReport = reportTypes.find(r => r.id === reportType);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h3>
            
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="mt-1 grid grid-cols-1 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !dateRange.startDate || !dateRange.endDate}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Export Options</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportData('pdf')}
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => handleExportData('excel')}
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview/Description */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedReport?.name}
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedReport?.description}
                </p>
              </div>
              {selectedReport?.icon && (
                <selectedReport.icon className="h-8 w-8 text-blue-500" />
              )}
            </div>

            {/* Sample report content based on type */}
            <div className="space-y-6">
              {reportType === 'performance' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-900">87%</div>
                      <div className="text-sm text-green-700">Average Collection Rate</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-900">92%</div>
                      <div className="text-sm text-blue-700">Compliance Rate</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-900">45</div>
                      <div className="text-sm text-purple-700">Active Companies</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Top Performing Companies</h4>
                    <div className="space-y-2">
                      {['Green Waste Solutions', 'Eco Collection Services', 'Urban Sanitation Ltd'].map((company, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                          <span>{company}</span>
                          <span className="font-medium text-green-600">{90 - index * 5}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {reportType === 'compliance' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-900">38</div>
                      <div className="text-sm text-green-700">Compliant</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-900">5</div>
                      <div className="text-sm text-yellow-700">Warnings</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-900">2</div>
                      <div className="text-sm text-orange-700">Non-Compliant</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-900">0</div>
                      <div className="text-sm text-red-700">Suspended</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Compliance Actions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-white rounded">
                        <span>Urban Sanitation Ltd - Missed collection</span>
                        <span className="text-yellow-600">Warning issued</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded">
                        <span>Metro Waste - Damaged bins</span>
                        <span className="text-orange-600">Fine imposed</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {reportType === 'issues' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">15</div>
                      <div className="text-sm text-gray-700">Reported</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-900">8</div>
                      <div className="text-sm text-blue-700">In Progress</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-900">23</div>
                      <div className="text-sm text-green-700">Resolved</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-900">2</div>
                      <div className="text-sm text-purple-700">Escalated</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Issue Types Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { type: 'Missed Pickups', count: 12, color: 'bg-red-500' },
                        { type: 'Damaged Bins', count: 8, color: 'bg-orange-500' },
                        { type: 'Complaints', count: 15, color: 'bg-yellow-500' },
                        { type: 'Compliance Violations', count: 5, color: 'bg-purple-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                          <span className="flex-1 text-sm">{item.type}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {reportType === 'programs' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-900">8</div>
                      <div className="text-sm text-blue-700">Active Programs</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-900">$1.2M</div>
                      <div className="text-sm text-green-700">Total Budget</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-900">68%</div>
                      <div className="text-sm text-purple-700">Average Progress</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Program Progress</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Recycling Initiative', progress: 85 },
                        { name: 'Composting Program', progress: 60 },
                        { name: 'Hazardous Waste', progress: 90 },
                        { name: 'Bulk Collection', progress: 45 }
                      ].map((program, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{program.name}</span>
                            <span>{program.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${program.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Default preview for other report types */}
              {!['performance', 'compliance', 'issues', 'programs'].includes(reportType) && (
                <div className="text-center py-12">
                  <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Report Preview</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a report type and date range to generate a detailed report.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;