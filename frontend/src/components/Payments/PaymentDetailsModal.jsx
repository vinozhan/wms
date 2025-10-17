import React from 'react';

const PaymentDetailsModal = ({ payment, onClose }) => {
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">
            Payment Details - Invoice {payment.invoiceNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payment Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{payment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Date:</span>
                <span className="font-medium">{formatDate(payment.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(payment.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium">
                  {formatDate(payment.billingPeriod.startDate)} - {formatDate(payment.billingPeriod.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Collection Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Collection Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Collections Count:</span>
                <span className="font-medium">{payment.collections?.length || 0}</span>
              </div>
              {payment.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="font-medium">{formatDate(payment.paymentDate)}</span>
                </div>
              )}
              {payment.paymentDetails?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">{payment.paymentDetails.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charges Breakdown */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Charges Breakdown</h4>
          
          {/* Waste Charges */}
          {payment.charges?.wasteCharges && payment.charges.wasteCharges.length > 0 && (
            <div className="mb-4">
              <h5 className="text-md font-medium text-gray-800 mb-2">Waste Collection Charges</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payment.charges.wasteCharges.map((charge, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {charge.wasteType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {charge.weight}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(charge.rate, payment.totals.currency)}/kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(charge.amount, payment.totals.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Penalties */}
          {payment.charges?.penalties && payment.charges.penalties.length > 0 && (
            <div className="mb-4">
              <h5 className="text-md font-medium text-gray-800 mb-2">Penalties</h5>
              <div className="space-y-2">
                {payment.charges.penalties.map((penalty, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm text-red-800">{penalty.description}</span>
                    <span className="text-sm font-medium text-red-900">
                      {formatCurrency(penalty.amount, payment.totals.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discounts */}
          {payment.charges?.discounts && payment.charges.discounts.length > 0 && (
            <div className="mb-4">
              <h5 className="text-md font-medium text-gray-800 mb-2">Discounts</h5>
              <div className="space-y-2">
                {payment.charges.discounts.map((discount, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm text-green-800">{discount.description}</span>
                    <span className="text-sm font-medium text-green-900">
                      -{formatCurrency(discount.amount, payment.totals.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(payment.totals.subtotal, payment.totals.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatCurrency(payment.totals.taxAmount, payment.totals.currency)}</span>
              </div>
              {payment.totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Total Discount:</span>
                  <span className="font-medium">-{formatCurrency(payment.totals.discountAmount, payment.totals.currency)}</span>
                </div>
              )}
              {payment.totals.penaltyAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Total Penalty:</span>
                  <span className="font-medium">+{formatCurrency(payment.totals.penaltyAmount, payment.totals.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total Amount:</span>
                <span>{formatCurrency(payment.totals.totalAmount, payment.totals.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;