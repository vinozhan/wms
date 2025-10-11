import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../utils/api';
import { 
  CreditCardIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createPayHerePayment } from '../../utils/payhere';

// PayHere integration
const PayHerePayment = ({ payment, onSuccess, onError }) => {
  const payWithPayHere = () => {
    createPayHerePayment({
      payment,
      onSuccess,
      onError,
      onDismissed: () => {
        console.log('Payment dismissed by user');
      }
    });
  };

  return (
    <button
      onClick={payWithPayHere}
      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
    >
      <CreditCardIcon className="h-5 w-5" />
      <span>Pay with PayHere</span>
    </button>
  );
};

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPayments();
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (orderId, paymentId) => {
    try {
      await paymentAPI.processPayment(paymentId, {
        transactionId: orderId,
        provider: 'PayHere'
      });
      toast.success('Payment processed successfully!');
      fetchPayments(); // Refresh the list
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Payment processing failed');
    }
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed: ' + error);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'processing': return <ClockIcon className="h-4 w-4" />;
      case 'failed': return <ExclamationCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const totalAmountPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totals.totalAmount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.totals.totalAmount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="text-gray-600">Manage your waste management payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(totalAmountPaid)}
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
                <ClockIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(pendingAmount)}
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
                <DocumentTextIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bills</dt>
                  <dd className="text-lg font-medium text-gray-900">{payments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'pending', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === status
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status === 'all' ? 'All Payments' : status}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {status === 'all' ? payments.length : payments.filter(p => p.status === status).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No payment records available.' : `No ${filter} payments found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div key={payment._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Invoice #{payment.invoiceNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.billingPeriod.startDate)} - {formatDate(payment.billingPeriod.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(payment.totals.totalAmount, payment.totals.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {formatDate(payment.dueDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Charges Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(payment.totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(payment.totals.taxAmount)}</span>
                      </div>
                      {payment.totals.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(payment.totals.discountAmount)}</span>
                        </div>
                      )}
                      {payment.totals.penaltyAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Penalty:</span>
                          <span>+{formatCurrency(payment.totals.penaltyAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h4>
                    <div className="text-sm">
                      <div className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="capitalize">{payment.paymentDetails.method.replace('_', ' ')}</span>
                      </div>
                      {payment.paymentDetails.transactionId && (
                        <div className="mt-1 text-gray-600">
                          Trans ID: {payment.paymentDetails.transactionId}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Collections</h4>
                    <div className="text-sm">
                      <span>{payment.collections?.length || 0} collections</span>
                      {payment.paymentDate && (
                        <div className="mt-1 text-gray-600">
                          Paid: {formatDate(payment.paymentDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      View Details
                    </button>
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      Download Invoice
                    </button>
                  </div>
                  
                  {payment.status === 'pending' && (
                    <PayHerePayment
                      payment={payment}
                      onSuccess={(orderId) => handlePaymentSuccess(orderId, payment._id)}
                      onError={handlePaymentError}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;