import { useState, useEffect } from 'react';
import axios from 'axios';
import { TransactionList, TransactionStats, TransactionFilters } from '../../components/TransactionComponents';

const PaymentDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5005/api/payments/transactions');
      setTransactions(response.data.transactions || response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5005/api/payments/transactions/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.dateRange === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(t => new Date(t.createdAt).toDateString() === today);
    } else if (filters.dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.createdAt) >= weekAgo);
    } else if (filters.dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.createdAt) >= monthAgo);
    } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      filtered = filtered.filter(t => {
        const date = new Date(t.createdAt);
        return date >= new Date(filters.startDate) && date <= new Date(filters.endDate);
      });
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.appointmentId?.toString().includes(term) ||
        t.transactionId?.toLowerCase().includes(term) ||
        t.customerEmail?.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleExport = () => {
    const csv = convertToCSV(filteredTransactions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString()}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    const headers = ['Transaction ID', 'Appointment ID', 'Amount', 'Status', 'Date', 'Customer Email'];
    const rows = data.map(t => [
      t.transactionId,
      t.appointmentId,
      t.amount,
      t.status,
      new Date(t.createdAt).toLocaleString(),
      t.customerEmail || 'N/A'
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage all payment activities</p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && <TransactionStats stats={stats} transactions={filteredTransactions} />}
        <TransactionFilters filters={filters} onFilterChange={handleFilterChange} />
        <TransactionList 
          transactions={filteredTransactions} 
          onRefresh={fetchTransactions}
        />
      </div>
    </div>
  );
};

export default PaymentDashboard;