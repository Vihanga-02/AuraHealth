import { useEffect, useState } from 'react';
import axios from 'axios';
import NotificationTable from '../../components/NotificationTable';
import { MessageSquare, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const NotificationDashboard = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, SENT: 0, PENDING: 0, FAILED: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      // Fallback for demo, actual backend runs on 5006
      const url = 'http://localhost:5006/api/notifications';
      const response = await axios.get(url);
      if (response.data.success) {
        setData(response.data.data.notifications);
        setStats(response.data.data.stats);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin text-blue-600">
          <RefreshCw size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Notifications Setup</h2>
          <p className="text-gray-500 mt-1">Real-time overview of your SMS dispatch system</p>
        </div>
        <button 
          onClick={fetchNotifications}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total SMS Processed" 
          value={stats.total} 
          icon={<MessageSquare size={24} />} 
          color="blue" 
        />
        <StatCard 
          title="Delivered Successfully" 
          value={stats.SENT || 0} 
          icon={<CheckCircle size={24} />} 
          color="green" 
        />
        <StatCard 
          title="Pending / Queued" 
          value={stats.PENDING || 0} 
          icon={<RefreshCw size={24} />} 
          color="yellow" 
        />
        <StatCard 
          title="Failed Delivery" 
          value={stats.FAILED || 0} 
          icon={<AlertCircle size={24} />} 
          color="red" 
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>Could not connect to Notification Service: {error}</p>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">Recent Dispatches</h3>
        </div>
        <NotificationTable data={data} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default NotificationDashboard;
