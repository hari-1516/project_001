import { useEffect, useState } from 'react';
import { Shield, Trash2, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const updateRole = async (id, role) => {
    try {
      await api.put(`/auth/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
        Admin access is required.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600" />
          Admin Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage teachers and administrators</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Users</h2>
        </div>

        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(item => (
                  <tr key={item._id} className="border-b border-slate-50">
                    <td className="p-4 font-medium text-slate-800">{item.name}</td>
                    <td className="p-4 text-slate-500">{item.email}</td>
                    <td className="p-4">
                      <select
                        value={item.role}
                        onChange={(e) => updateRole(item._id, e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        disabled={item._id === user._id}
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeUser(item._id)}
                        disabled={item._id === user._id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
