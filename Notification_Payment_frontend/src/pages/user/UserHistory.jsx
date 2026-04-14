// frontend/src/pages/user/UserHistory.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const UserHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // For demo purposes, we fetch all. In a real app with auth, 
        // this endpoint would filter by the logged-in user.
        const response = await axios.get('http://localhost:5005/api/payments/transactions');
        setTransactions(response.data.transactions || response.data);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      succeeded: { color: 'green', text: 'Successful' },
      pending: { color: 'yellow', text: 'Pending' },
      failed: { color: 'red', text: 'Failed' },
      refunded: { color: 'gray', text: 'Refunded' }
    };
    const config = statusConfig[status] || { color: 'gray', text: status };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
            <p className="text-gray-500 mt-2">View your recent payment history and receipts.</p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm font-medium"
          >
            Back to Home
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-600">No transactions found</p>
              <p className="text-sm mt-1">Your payment history will appear here once you make a transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Appointment</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50/50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.status === 'succeeded' ? 'bg-green-100 text-green-600' : t.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="font-mono text-sm text-gray-600" title={t.transactionId}>
                            {t.transactionId?.slice(0, 12)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{new Date(t.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 text-sm font-medium border border-gray-200">
                          APT-{t.appointmentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {t.currency?.toUpperCase() || 'LKR'} {t.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(t.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;
