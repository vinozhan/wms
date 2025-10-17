import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { environmentalAPI } from '../../utils/api';
import { 
  GlobeAltIcon,
  BoltIcon,
  BeakerIcon,
  TrophyIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { TreePine, Droplets, Wind, Recycle, Award, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const EnvironmentalDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [impactSummary, setImpactSummary] = useState(null);
  const [systemImpact, setSystemImpact] = useState(null);
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedScope, setSelectedScope] = useState('user');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedScope]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const promises = [];
      
      // User-specific impact
      if (selectedScope === 'user') {
        promises.push(
          environmentalAPI.getUserImpactSummary(user._id, selectedPeriod),
          environmentalAPI.getSustainabilityMetrics('user', user._id)
        );
      } else if (selectedScope === 'district') {
        promises.push(
          environmentalAPI.getDistrictImpact(user.address?.city || 'Unknown', selectedPeriod),
          environmentalAPI.getSustainabilityMetrics('district', user.address?.city)
        );
      } else {
        promises.push(
          environmentalAPI.getSystemImpact(selectedPeriod),
          environmentalAPI.getSustainabilityMetrics('system', 'all')
        );
      }

      const [impactResponse, metricsResponse] = await Promise.all(promises);
      
      if (selectedScope === 'user') {
        setImpactSummary(impactResponse.data);
      } else {
        setSystemImpact(impactResponse.data);
      }
      
      setSustainabilityMetrics(metricsResponse.data);
      
    } catch (error) {
      console.error('Failed to fetch environmental data:', error);
      toast.error('Failed to load environmental data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      const scopeId = selectedScope === 'user' ? user._id :
                     selectedScope === 'district' ? user.address?.city :
                     'all';
      
      const response = await environmentalAPI.generateEnvironmentalReport(
        selectedScope,
        scopeId,
        selectedPeriod
      );
      
      // Create download link for the report
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `environmental-impact-report-${selectedScope}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Environmental report generated and downloaded!');
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate environmental report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(1);
  };

  const getSustainabilityColor = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'outstanding': return 'text-green-600';
      case 'excellent': return 'text-blue-600';
      case 'good': return 'text-yellow-600';
      case 'fair': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const data = selectedScope === 'user' ? impactSummary : systemImpact;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Environmental Impact</h1>
          <p className="text-gray-600">Track and monitor environmental sustainability</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="user">My Impact</option>
            {user.userType === 'admin' && <option value="district">District Impact</option>}
            {user.userType === 'admin' && <option value="system">System Wide</option>}
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
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

      {/* Sustainability Score Card */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sustainability Score</h2>
            <p className="text-green-100">Overall environmental performance</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {sustainabilityMetrics?.circularEconomyScore?.toFixed(0) || 0}/100
            </div>
            <div className="text-lg">
              {sustainabilityMetrics?.sustainabilityRating || 'Fair'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Carbon Impact</dt>
                  <dd className="text-lg font-medium text-gray-900 flex items-center">
                    {data?.environmental?.carbon?.isNetPositive ? (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    {formatNumber(Math.abs(data?.environmental?.carbon?.netImpact))} kg CO2
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={data?.environmental?.carbon?.isNetPositive ? 'text-green-600' : 'text-red-600'}>
                {data?.environmental?.carbon?.isNetPositive ? 'Carbon Negative' : 'Carbon Positive'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BoltIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Energy Impact</dt>
                  <dd className="text-lg font-medium text-gray-900 flex items-center">
                    {data?.environmental?.energy?.isNetPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    {formatNumber(Math.abs(data?.environmental?.energy?.totalSavings))} kWh
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={data?.environmental?.energy?.isNetPositive ? 'text-green-600' : 'text-red-600'}>
                {data?.environmental?.energy?.isNetPositive ? 'Energy Positive' : 'Energy Negative'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Droplets className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Water Savings</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(data?.environmental?.water?.totalSavings)} L
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">
                Water Conservation
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Recycle className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Diversion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.diversionRate?.toFixed(1) || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-purple-600 font-medium">
                From Landfill
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Impact Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TreePine className="h-5 w-5 mr-2 text-gray-400" />
              Environmental Benefits
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-600">Carbon Saved</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatNumber(data?.environmental?.carbon?.totalSavings)} kg CO2
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BoltIcon className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-sm text-gray-600">Energy Saved</span>
                </div>
                <span className="text-sm font-medium text-yellow-600">
                  {formatNumber(data?.environmental?.energy?.totalSavings)} kWh
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm text-gray-600">Water Saved</span>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {formatNumber(data?.environmental?.water?.totalSavings)} liters
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <TreePine className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-600">Trees Equivalent</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {Math.floor((data?.environmental?.carbon?.totalSavings || 0) / 22)} trees
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Wind className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-600">Air Quality Improvement</span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  +{((data?.environmental?.carbon?.totalSavings || 0) * 0.1).toFixed(1)} AQI points
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-gray-400" />
              Achievements & Insights
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.achievements?.map((achievement, index) => (
                <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-sm font-medium text-yellow-800">{achievement}</span>
                </div>
              ))}
              
              {data?.insights?.map((insight, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">{insight.category}</div>
                    <div className="text-xs text-blue-600">{insight.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Ratings Breakdown */}
      {data?.sustainabilityRatings && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sustainability Distribution</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(data.sustainabilityRatings).map(([rating, count]) => (
                <div key={rating} className="text-center">
                  <div className={`text-2xl font-bold ${getSustainabilityColor(rating)}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{rating}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data?.recommendations?.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-800">
                        {recommendation.category}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {recommendation.suggestion}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        recommendation.priority === 'High' ? 'bg-red-100 text-red-800' :
                        recommendation.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {recommendation.priority}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {recommendation.expectedImpact}
                      </div>
                      <div className="text-xs text-gray-500">
                        {recommendation.timeframe}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Economic Impact */}
      {data?.economic && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Economic Impact</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  LKR {formatNumber(data.economic.totalCostSavings)}
                </div>
                <div className="text-sm text-gray-600">Total Cost Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  LKR {data.economic.costSavingsPerKg?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-gray-600">Savings per kg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.summary?.totalWaste?.toFixed(0) || 0} kg
                </div>
                <div className="text-sm text-gray-600">Total Waste Processed</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalDashboard;