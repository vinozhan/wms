import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recyclingCreditsAPI } from '../../utils/api';
import { 
  CurrencyDollarIcon,
  ScaleIcon,
  TrophyIcon,
  GiftIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { Recycle, Leaf, Award, Target, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const RecyclingCredits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creditSummary, setCreditSummary] = useState(null);
  const [userCredits, setUserCredits] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [summaryResponse, creditsResponse, achievementsResponse] = await Promise.all([
        recyclingCreditsAPI.getUserCreditSummary(user._id, selectedPeriod),
        recyclingCreditsAPI.getUserCredits(user._id, { 
          limit: 20, 
          sort: '-createdAt' 
        }),
        recyclingCreditsAPI.getUserAchievements(user._id)
      ]);

      setCreditSummary(summaryResponse.data);
      setUserCredits(creditsResponse.data.credits || []);
      setAchievements(achievementsResponse.data || []);
      
    } catch (error) {
      console.error('Failed to fetch recycling credits data:', error);
      toast.error('Failed to load recycling credits data');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async (creditId, paymentMethod) => {
    try {
      const response = await recyclingCreditsAPI.processCreditPayout(
        creditId, 
        paymentMethod, 
        user._id
      );
      
      toast.success('Payout processed successfully!');
      await fetchData();
      setShowPayoutModal(false);
      setSelectedCredit(null);
      
    } catch (error) {
      console.error('Payout failed:', error);
      toast.error('Failed to process payout');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'credited': return 'bg-blue-100 text-blue-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWasteTypeIcon = (wasteType) => {
    switch (wasteType) {
      case 'electronic': return '📱';
      case 'recyclable': return '♻️';
      case 'organic': return '🌱';
      case 'hazardous': return '⚠️';
      default: return '🗑️';
    }
  };

  const getLoyaltyTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'text-gray-400';
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-300';
      case 'bronze': return 'text-orange-400';
      default: return 'text-gray-400';
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
          <h1 className="text-3xl font-bold text-gray-900">Recycling Credits</h1>
          <p className="text-gray-600">Earn credits for recycling and get rewarded</p>
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
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Total Credits</dt>
                  <dd className="text-lg font-medium text-white">
                    {creditSummary?.summary?.totalCredits?.toFixed(0) || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Monetary Value</dt>
                  <dd className="text-lg font-medium text-white">
                    LKR {creditSummary?.summary?.totalMonetaryValue?.toFixed(0) || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ScaleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Total Weight</dt>
                  <dd className="text-lg font-medium text-white">
                    {creditSummary?.summary?.totalWeight?.toFixed(1) || 0} kg
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-orange-100 truncate">Collections</dt>
                  <dd className="text-lg font-medium text-white">
                    {creditSummary?.summary?.totalCollections || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-400 to-gray-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className={`h-6 w-6 ${getLoyaltyTierColor(creditSummary?.loyaltyTier)}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-100 truncate">Loyalty Tier</dt>
                  <dd className="text-lg font-medium text-white capitalize">
                    {creditSummary?.loyaltyTier || 'Bronze'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Leaf className="h-5 w-5 mr-2 text-gray-400" />
              Environmental Impact
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Carbon Reduction</span>
                <span className="text-sm font-medium text-green-600">
                  -{creditSummary?.environmental?.carbonReduction?.toFixed(1) || 0} kg CO2
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Energy Saved</span>
                <span className="text-sm font-medium text-blue-600">
                  {creditSummary?.environmental?.energySaved?.toFixed(1) || 0} kWh
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Water Saved</span>
                <span className="text-sm font-medium text-purple-600">
                  {creditSummary?.environmental?.waterSaved?.toFixed(1) || 0} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trees Equivalent</span>
                <span className="text-sm font-medium text-green-600">
                  {creditSummary?.environmental?.equivalentTrees || 0} trees
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              Progress to Next Milestone
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Next: {creditSummary?.nextMilestone?.target} credits
                </span>
                <span className="text-gray-900 font-medium">
                  {creditSummary?.nextMilestone?.progress?.toFixed(0) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${creditSummary?.nextMilestone?.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {creditSummary?.nextMilestone?.remaining || 0} credits remaining
              </p>
            </div>

            {/* Achievements */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 4).map((achievement, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waste Type Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
            Waste Type Breakdown
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {creditSummary?.wasteTypeBreakdown && Object.entries(creditSummary.wasteTypeBreakdown).map(([type, data]) => (
              <div key={type} className="text-center p-4 border rounded-lg">
                <div className="text-3xl mb-2">{getWasteTypeIcon(type)}</div>
                <div className="text-sm text-gray-600 capitalize mb-1">{type}</div>
                <div className="text-lg font-semibold text-gray-900">{data.credits?.toFixed(0) || 0}</div>
                <div className="text-xs text-gray-500">{data.weight?.toFixed(1) || 0} kg</div>
                <div className="text-xs text-gray-500">{data.count || 0} collections</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Credits */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Credits</h3>
          <button
            onClick={() => fetchData()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
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
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userCredits.map((credit) => (
                <tr key={credit._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(credit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getWasteTypeIcon(credit.wasteType)}</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {credit.wasteType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.weight} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      credit.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                      credit.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                      credit.quality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      credit.quality === 'poor' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {credit.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {credit.creditCalculation?.netCredits?.toFixed(0) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    LKR {credit.monetaryValue?.monetaryAmount?.toFixed(0) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(credit.status)}`}>
                      {credit.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {credit.status === 'verified' && (
                      <button
                        onClick={() => {
                          setSelectedCredit(credit);
                          setShowPayoutModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Request Payout
                      </button>
                    )}
                    {credit.status === 'credited' && (
                      <span className="text-green-600 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && selectedCredit && (
        <PayoutModal
          credit={selectedCredit}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedCredit(null);
          }}
          onPayout={requestPayout}
        />
      )}
    </div>
  );
};

// Payout Modal Component
const PayoutModal = ({ credit, onClose, onPayout }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('account_credit');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { value: 'account_credit', label: 'Account Credit', description: 'Credit to your account balance' },
    { value: 'mobile_payment', label: 'Mobile Payment', description: 'Direct transfer to mobile wallet' },
    { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to bank account' },
    { value: 'discount_voucher', label: 'Discount Voucher', description: 'Use as discount on next bill' }
  ];

  const handlePayout = async () => {
    setProcessing(true);
    try {
      await onPayout(credit._id, selectedPaymentMethod);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Request Payout</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">Credit Details</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>Credits: {credit.creditCalculation?.netCredits?.toFixed(0) || 0}</div>
                <div>Value: LKR {credit.monetaryValue?.monetaryAmount?.toFixed(0) || 0}</div>
                <div>Waste Type: {credit.wasteType}</div>
                <div>Weight: {credit.weight} kg</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label key={method.value} className="flex items-start">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={selectedPaymentMethod === method.value}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{method.label}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayout}
              disabled={processing}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {processing ? (
                <>
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <GiftIcon className="h-4 w-4 mr-2" />
                  Request Payout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecyclingCredits;