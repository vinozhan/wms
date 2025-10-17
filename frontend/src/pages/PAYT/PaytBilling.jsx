import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paytAPI } from '../../utils/api';
import { 
  CurrencyDollarIcon, 
  ScaleIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TrendingDown, TrendingUp, Recycle, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const PaytBilling = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wasteStats, setWasteStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [billData, setBillData] = useState(null);
  const [showBillCalculator, setShowBillCalculator] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, recommendationsResponse] = await Promise.all([
        paytAPI.getWasteStatistics(user._id, selectedPeriod),
        paytAPI.getOptimizationRecommendations(user._id)
      ]);

      setWasteStats(statsResponse.data);
      setRecommendations(recommendationsResponse.data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch PAYT data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBill = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(1); // First day of current month
      const endDate = new Date();
      
      const billingPeriod = { startDate, endDate };
      
      const billResponse = await paytAPI.calculateBill(user._id, billingPeriod, {});
      setBillData(billResponse.data);
      setShowBillCalculator(true);
    } catch (error) {
      console.error('Failed to calculate bill:', error);
      toast.error('Failed to calculate bill');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Pay-As-You-Throw Billing</h1>
          <p className="text-gray-600">Weight-based waste billing and optimization</p>
        </div>
        
        <div className="flex items-center space-x-4">
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
            onClick={calculateBill}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <CurrencyDollarIcon className="h-5 w-5" />
            <span>Calculate Bill</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ScaleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Weight</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteStats?.totalWeight?.toFixed(1) || 0} kg
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
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Collections</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteStats?.totalCollections || 0}
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
                <Recycle className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recycling Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(wasteStats?.recyclingRate * 100)?.toFixed(1) || 0}%
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
                <CurrencyDollarIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cost Savings</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    LKR {wasteStats?.costSavings?.totalSavings?.toFixed(0) || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waste Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Waste by Type
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {wasteStats?.wasteByType && Object.entries(wasteStats.wasteByType).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      type === 'recyclable' ? 'bg-green-400' :
                      type === 'organic' ? 'bg-yellow-400' :
                      type === 'electronic' ? 'bg-blue-400' :
                      type === 'hazardous' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{data.weight?.toFixed(1)} kg</div>
                    <div className="text-xs text-gray-500">{data.count} collections</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Leaf className="h-5 w-5 mr-2 text-gray-400" />
              Environmental Impact
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Carbon Footprint Reduction</span>
                <span className="text-sm font-medium text-green-600">
                  -{wasteStats?.environmentalImpact?.carbonFootprintReduction?.toFixed(1) || 0} kg CO2
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Energy Saved</span>
                <span className="text-sm font-medium text-blue-600">
                  {wasteStats?.environmentalImpact?.energySaved?.toFixed(1) || 0} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Water Saved</span>
                <span className="text-sm font-medium text-purple-600">
                  {wasteStats?.environmentalImpact?.waterSaved?.toFixed(1) || 0} liters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CogIcon className="h-5 w-5 mr-2 text-gray-400" />
              Optimization Recommendations
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {recommendation.impact === 'high' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                      ) : recommendation.impact === 'medium' ? (
                        <ClockIcon className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-800">
                        {recommendation.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {recommendation.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {recommendation.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          Potential savings: {recommendation.potentialSavings}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bill Calculator Modal */}
      {showBillCalculator && billData && (
        <BillCalculatorModal 
          billData={billData} 
          onClose={() => setShowBillCalculator(false)} 
        />
      )}
    </div>
  );
};

// Bill Calculator Modal Component
const BillCalculatorModal = ({ billData, onClose }) => {
  const generateInvoice = async () => {
    try {
      const response = await paytAPI.generateInvoice(billData, {});
      toast.success('Invoice generated successfully!');
      // Here you would typically download or display the invoice
      console.log('Invoice generated:', response.data);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium text-gray-900">PAYT Bill Calculation</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Bill Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Period:</span>
                  <span className="font-medium">
                    {new Date(billData.billingPeriod.startDate).toLocaleDateString()} - 
                    {new Date(billData.billingPeriod.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Model:</span>
                  <span className="font-medium capitalize">
                    {billData.calculation.billingModel.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Collections:</span>
                  <span className="font-medium">{billData.collections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Weight:</span>
                  <span className="font-medium">
                    {billData.collections.reduce((sum, c) => sum + c.weight, 0).toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Rate:</span>
                  <span className="font-medium">LKR {billData.calculation.breakdown.baseRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waste Charges:</span>
                  <span className="font-medium">LKR {billData.calculation.breakdown.wasteCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recycling Credits:</span>
                  <span className="font-medium text-green-600">
                    -LKR {billData.calculation.breakdown.recyclingCredits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">LKR {billData.calculation.taxAmount}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Final Amount:</span>
                  <span className="text-green-600">LKR {billData.calculation.finalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collections Detail */}
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Collection Details</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billData.collections.map((collection, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(collection.collectionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {collection.wasteType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collection.weight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          collection.quality === 'clean' ? 'bg-green-100 text-green-800' :
                          collection.quality === 'contaminated' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {collection.quality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={generateInvoice}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaytBilling;