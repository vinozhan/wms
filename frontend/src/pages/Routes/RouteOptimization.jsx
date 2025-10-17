import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { routeOptimizationAPI } from '../../utils/api';
import { 
  MapIcon,
  ClockIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Route, Zap, Target, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const RouteOptimization = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [showBulkOptimization, setShowBulkOptimization] = useState(false);

  const algorithms = [
    { value: 'dijkstra', name: 'Dijkstra (Fast)', description: 'Quick optimization for daily routes' },
    { value: 'genetic', name: 'Genetic Algorithm', description: 'Best for complex routes with many stops' },
    { value: 'ant_colony', name: 'Ant Colony', description: 'Good balance of speed and optimization' },
    { value: 'nearest_neighbor', name: 'Nearest Neighbor', description: 'Simple and reliable approach' },
    { value: 'simulated_annealing', name: 'Simulated Annealing', description: 'Excellent for avoiding local optima' }
  ];

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      
      const routesResponse = await routeOptimizationAPI.getRoutes({
        status: 'active',
        ...(user.userType !== 'admin' && { assignedCollector: user._id })
      });
      
      setRoutes(routesResponse.data.routes || []);
      
      // Fetch recommendations for each route
      const recommendationsPromises = routesResponse.data.routes.map(route =>
        routeOptimizationAPI.getOptimizationRecommendations(route._id)
          .then(res => ({ [route._id]: res.data }))
          .catch(() => ({ [route._id]: { recommendations: [] } }))
      );
      
      const recommendationsResults = await Promise.all(recommendationsPromises);
      const recommendationsMap = recommendationsResults.reduce((acc, curr) => ({...acc, ...curr}), {});
      setRecommendations(recommendationsMap);
      
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async (routeId) => {
    try {
      setOptimizing(true);
      
      const response = await routeOptimizationAPI.optimizeRoute(
        routeId, 
        selectedAlgorithm, 
        { timePerStop: 5, distanceType: 'haversine' }
      );
      
      setOptimizationResults(response.data);
      toast.success(`Route optimized! Saved ${response.data.timeSaved} minutes and LKR ${response.data.costSavings.toFixed(0)}`);
      
      // Refresh routes to show updated optimization
      await fetchRoutes();
      
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error('Route optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const optimizeMultipleRoutes = async () => {
    if (selectedRoutes.length === 0) {
      toast.error('Please select routes to optimize');
      return;
    }

    try {
      setOptimizing(true);
      
      const response = await routeOptimizationAPI.optimizeMultipleRoutes(
        selectedRoutes, 
        selectedAlgorithm, 
        { timePerStop: 5, distanceType: 'haversine' }
      );
      
      setOptimizationResults(response.data);
      toast.success(`${response.data.optimizedRoutes.length} routes optimized! Total savings: LKR ${response.data.totalCostSavings.toFixed(0)}`);
      
      await fetchRoutes();
      setSelectedRoutes([]);
      setShowBulkOptimization(false);
      
    } catch (error) {
      console.error('Bulk optimization failed:', error);
      toast.error('Bulk optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handleRouteSelection = (routeId) => {
    setSelectedRoutes(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
          <p className="text-gray-600">Optimize collection routes for maximum efficiency</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {algorithms.map(algo => (
              <option key={algo.value} value={algo.value}>
                {algo.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowBulkOptimization(!showBulkOptimization)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Target className="h-5 w-5" />
            <span>Bulk Optimize</span>
          </button>
        </div>
      </div>

      {/* Algorithm Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-blue-800">
            {algorithms.find(a => a.value === selectedAlgorithm)?.name}
          </h3>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {algorithms.find(a => a.value === selectedAlgorithm)?.description}
        </p>
      </div>

      {/* Bulk Optimization Panel */}
      {showBulkOptimization && (
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-400">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bulk Route Optimization</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedRoutes.length} routes selected
              </span>
              <button
                onClick={optimizeMultipleRoutes}
                disabled={optimizing || selectedRoutes.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {optimizing ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span>Optimize Selected</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {routes.map(route => (
              <label key={route._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedRoutes.includes(route._id)}
                  onChange={() => handleRouteSelection(route._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{route.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {routes.map((route) => (
          <RouteCard
            key={route._id}
            route={route}
            recommendations={recommendations[route._id]}
            selectedAlgorithm={selectedAlgorithm}
            optimizing={optimizing}
            onOptimize={() => optimizeRoute(route._id)}
            showSelection={showBulkOptimization}
            isSelected={selectedRoutes.includes(route._id)}
            onSelectionChange={() => handleRouteSelection(route._id)}
          />
        ))}
      </div>

      {/* Optimization Results Modal */}
      {optimizationResults && (
        <OptimizationResultsModal
          results={optimizationResults}
          onClose={() => setOptimizationResults(null)}
        />
      )}
    </div>
  );
};

// Route Card Component
const RouteCard = ({ 
  route, 
  recommendations, 
  selectedAlgorithm, 
  optimizing, 
  onOptimize, 
  showSelection, 
  isSelected, 
  onSelectionChange 
}) => {
  const needsOptimization = !route.optimization?.isOptimized || 
    (route.optimization?.optimizedAt && 
     Date.now() - new Date(route.optimization.optimizedAt).getTime() > 7 * 24 * 60 * 60 * 1000);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {showSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelectionChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
              <p className="text-sm text-gray-600">{route.district}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(route.status)}`}>
            {route.status}
          </span>
        </div>

        {/* Route Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Stops</div>
            <div className="text-lg font-semibold text-gray-900">{route.totalStops || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Distance</div>
            <div className="text-lg font-semibold text-gray-900">
              {route.optimization?.estimatedDistance?.toFixed(1) || 'N/A'} km
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {route.optimization?.estimatedTime ? Math.round(route.optimization.estimatedTime) : 'N/A'} min
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Fuel Cost</div>
            <div className="text-lg font-semibold text-gray-900">
              LKR {route.optimization?.estimatedFuelCost?.toFixed(0) || 'N/A'}
            </div>
          </div>
        </div>

        {/* Optimization Status */}
        <div className="flex items-center mb-4">
          {route.optimization?.isOptimized ? (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">
                Optimized {route.optimization.optimizedAt ? 
                  new Date(route.optimization.optimizedAt).toLocaleDateString() : 'recently'}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Needs optimization</span>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations?.recommendations?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
            <div className="space-y-1">
              {recommendations.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    rec.priority === 'high' ? 'bg-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`}></span>
                  {rec.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onOptimize}
          disabled={optimizing}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
            needsOptimization
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {optimizing ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : needsOptimization ? (
            <>
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Optimize Now
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Re-optimize
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Optimization Results Modal
const OptimizationResultsModal = ({ results, onClose }) => {
  const isBulkResult = results.optimizedRoutes && Array.isArray(results.optimizedRoutes);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium text-gray-900">
              {isBulkResult ? 'Bulk Optimization Results' : 'Route Optimization Results'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          {isBulkResult ? (
            <BulkOptimizationResults results={results} />
          ) : (
            <SingleOptimizationResults results={results} />
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SingleOptimizationResults = ({ results }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center">
          <TrendingDown className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <div className="text-sm text-green-600">Distance Saved</div>
            <div className="text-lg font-bold text-green-700">
              {(results.previousDistance - results.newDistance).toFixed(1)} km
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center">
          <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <div className="text-sm text-blue-600">Time Saved</div>
            <div className="text-lg font-bold text-blue-700">
              {results.timeSaved} min
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center">
          <TruckIcon className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <div className="text-sm text-purple-600">Fuel Saved</div>
            <div className="text-lg font-bold text-purple-700">
              {results.fuelSaved.toFixed(1)} L
            </div>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-8 w-8 text-orange-600 mr-3" />
          <div>
            <div className="text-sm text-orange-600">Cost Savings</div>
            <div className="text-lg font-bold text-orange-700">
              LKR {results.costSavings.toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Optimization Details */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Optimization Details</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Algorithm Used</div>
          <div className="font-medium capitalize">{results.algorithm.replace('_', ' ')}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Improvement</div>
          <div className="font-medium text-green-600">
            {results.improvement ? results.improvement.toFixed(1) : 'N/A'}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Previous Distance</div>
          <div className="font-medium">{results.previousDistance.toFixed(1)} km</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">New Distance</div>
          <div className="font-medium">{results.newDistance.toFixed(1)} km</div>
        </div>
      </div>
    </div>
  </div>
);

const BulkOptimizationResults = ({ results }) => (
  <div className="space-y-6">
    {/* Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-700">
          {results.optimizedRoutes.length}
        </div>
        <div className="text-sm text-green-600">Routes Optimized</div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-700">
          {results.totalTimeSaved} min
        </div>
        <div className="text-sm text-blue-600">Total Time Saved</div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-orange-700">
          LKR {results.totalCostSavings.toFixed(0)}
        </div>
        <div className="text-sm text-orange-600">Total Cost Savings</div>
      </div>
    </div>

    {/* Individual Results */}
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Individual Route Results</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Saved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Savings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.optimizedRoutes.map((route, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.routeId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.timeSaved} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  LKR {route.costSavings?.toFixed(0) || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Success
                  </span>
                </td>
              </tr>
            ))}
            {results.failedRoutes?.map((route, index) => (
              <tr key={`failed-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.routeId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Failed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default RouteOptimization;