import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Bell, Database, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notificationPrefs');
      return saved ? JSON.parse(saved) : { emailAlerts: true, lowAttendanceAlert: true, dailyReport: false };
    } catch {
      return { emailAlerts: true, lowAttendanceAlert: true, dailyReport: false };
    }
  });

  useEffect(() => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notifications));
  }, [notifications]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      showMessage('Profile updated successfully!');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    if (passwords.newPass.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      setPasswords({ current: '', newPass: '', confirm: '' });
      showMessage('Password changed successfully!');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-purple-600" />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and system preferences</p>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === id ? 'text-purple-600' : 'text-slate-400'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">Profile Information</h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{profile.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSave} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
              {[
                { label: 'Current Password', key: 'current' },
                { label: 'New Password', key: 'newPass' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">Notification Preferences</h2>
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important alerts via email' },
                { key: 'lowAttendanceAlert', label: 'Low Attendance Alerts', desc: 'Notify when attendance drops below 75%' },
                { key: 'dailyReport', label: 'Daily Reports', desc: 'Send a daily attendance summary email' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      notifications[key] ? 'bg-purple-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${
                      notifications[key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">System Information</h2>
              {[
                { label: 'Application', value: 'VisionAttend AI' },
                { label: 'Version', value: '1.0.0' },
                { label: 'Database', value: 'MongoDB Atlas' },
                { label: 'AI Engine', value: 'DeepFace + FastAPI' },
                { label: 'Frontend', value: 'React + Vite' },
                { label: 'Backend', value: 'Node.js + Express' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
