import { useState, useEffect } from 'react';
import { authApi } from '../../api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  const loadUsers = () => {
    authApi.adminUsers(filterRole ? { role: filterRole } : {})
      .then(res => setUsers(res.data.users))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [filterRole]);

  const toggleActive = async (id, currentStatus) => {
    try {
      await authApi.adminToggleActive(id, !currentStatus);
      loadUsers();
    } catch(err) { alert(err.response?.data?.message || 'Error updating user'); }
  };

  const deleteUser = async (id) => {
    if(confirm('Are you sure you want to delete this user?')) {
      try {
        await authApi.adminDeleteUser(id);
        loadUsers();
      } catch(err) { alert(err.response?.data?.message || 'Error deleting user'); }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Users</h2>
        <select 
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500"
          value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Patient">Patients</option>
          <option value="Doctor">Doctors</option>
          <option value="Admin">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="py-3 px-4 font-semibold text-xs text-slate-500 uppercase">ID</th>
              <th className="py-3 px-4 font-semibold text-xs text-slate-500 uppercase">User</th>
              <th className="py-3 px-4 font-semibold text-xs text-slate-500 uppercase">Role</th>
              <th className="py-3 px-4 font-semibold text-xs text-slate-500 uppercase">Status</th>
              <th className="py-3 px-4 font-semibold text-xs text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-500">#{u.user_id}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-800">{u.full_name || 'N/A'}</div>
                  <div className="text-sm text-slate-500">{u.email}</div>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-700">{u.role}</td>
                <td className="py-3 px-4">
                   <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                     {u.is_active ? 'Active' : 'Deactivated'}
                   </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => toggleActive(u.user_id, u.is_active)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 font-medium">
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteUser(u.user_id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
