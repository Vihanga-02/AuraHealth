import React from 'react';
import { Clock } from 'lucide-react';

const NotificationTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No notifications have been dispatched yet.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide">DELIVERED</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold tracking-wide">PENDING</span>;
      case 'FAILED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide">FAILED</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold tracking-wide">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending...';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
            <th className="px-6 py-4 font-medium">Log ID</th>
            <th className="px-6 py-4 font-medium">Recipient</th>
            <th className="px-6 py-4 font-medium">Message Body</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition">
              <td className="px-6 py-4 font-mono text-xs text-gray-500">#{row.id}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{row.recipient_number}</td>
              <td className="px-6 py-4">
                <p className="text-gray-600 text-sm max-w-sm truncate" title={row.message_body}>
                  {row.message_body}
                </p>
                {row.error_message && (
                  <p className="text-red-500 text-xs mt-1 truncate" title={row.error_message}>
                    Err: {row.error_message}
                  </p>
                )}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(row.status)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  {formatDate(row.sent_at)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NotificationTable;
