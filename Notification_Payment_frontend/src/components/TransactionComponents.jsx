import { useState } from 'react';
import axios from 'axios';

export const TransactionStats = ({ stats, transactions }) => {
  const totalAmount = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const successful = transactions.filter(t => t.status === 'succeeded').length;
  const pending = transactions.filter(t => t.status === 'pending').length;
  const failed = transactions.filter(t => t.status === 'failed').length;

  const statCards = [
    { title: 'Total Transactions', value: transactions.length, color: 'blue', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { title: 'Total Revenue', value: `LKR ${totalAmount.toLocaleString()}`, color: 'green', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Successful', value: successful, color: 'green', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Pending', value: pending, color: 'yellow', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Failed', value: failed, color: 'red', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`w-10 h-10 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
              <svg className={`w-5 h-5 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TransactionFilters = ({ filters, onFilterChange }) => {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'succeeded', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Transaction ID, Appointment ID..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {filters.dateRange === 'custom' && (
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex items-end">
          <button
            onClick={() => onFilterChange({
              status: 'all',
              dateRange: 'all',
              searchTerm: '',
              startDate: '',
              endDate: ''
            })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export const TransactionDetails = ({ transaction, onClose, onRefresh }) => {
  const [refunding, setRefunding] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;
    
    try {
      setRefunding(true);
      await axios.post(`http://localhost:5005/api/payments/transactions/${transaction.id}/refund`);
      setRefundMessage('Refund processed successfully!');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 2000);
    } catch (err) {
      setRefundMessage('Failed to process refund');
      console.error(err);
    } finally {
      setRefunding(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    const text = {
      succeeded: 'Successful',
      pending: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config[status] || 'bg-gray-100 text-gray-800'}`}>
        {text[status] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Transaction ID</label>
              <p className="text-sm font-mono text-gray-900 mt-1">{transaction.transactionId}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Appointment ID</label>
              <p className="text-sm font-medium text-gray-900 mt-1">APT-{transaction.appointmentId}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Amount</label>
              <p className="text-lg font-bold text-gray-900 mt-1">LKR {transaction.amount?.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Status</label>
              <p className="mt-1">{getStatusBadge(transaction.status)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Date & Time</label>
              <p className="text-sm text-gray-900 mt-1">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Payment Method</label>
              <p className="text-sm text-gray-900 mt-1">{transaction.paymentMethod || 'Card'}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm text-gray-900 mt-1">{transaction.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <p className="text-sm text-gray-900 mt-1">{transaction.customerName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {transaction.status === 'succeeded' && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {refunding ? 'Processing Refund...' : 'Process Refund'}
              </button>
              {refundMessage && (
                <p className={`text-sm mt-2 text-center ${refundMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {refundMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TransactionList = ({ transactions, onRefresh }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const statusConfig = {
      succeeded: { color: 'green', text: 'Successful' },
      pending: { color: 'yellow', text: 'Pending' },
      failed: { color: 'red', text: 'Failed' },
      refunded: { color: 'gray', text: 'Refunded' }
    };
    const config = statusConfig[status] || { color: 'gray', text: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.transactionId?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    APT-{transaction.appointmentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    LKR {transaction.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.customerEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};
