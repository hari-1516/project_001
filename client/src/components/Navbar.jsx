import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const pageTitles = {
  '/': 'Dashboard',
  '/register-student': 'Register Student',
  '/attendance': 'Attendance Capture',
  '/reports': 'Reports',
  '/live-attendance': 'Live Attendance',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
};

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(item => item && !item.read).length;

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch(() => setNotifications([]));
  }, []);

  const markRead = async () => {
    await api.put('/notifications/read');
    setNotifications(prev => prev.map(item => (item ? { ...item, read: true } : item)));
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) {
        navigate(`/reports?search=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Page Title */}
      <h2 className="text-lg font-semibold text-slate-800">{pageTitles[location.pathname] || 'VisionAttend AI'}</h2>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students..."
            onKeyDown={handleSearch}
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 w-48"
          />
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors" title="Notifications">
            <Bell className="w-5 h-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-slate-100 z-50">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markRead} className="text-xs text-purple-600 hover:text-purple-700">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n?._id} className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n?.read ? 'bg-purple-50/50' : ''}`}>
                      <p className="text-sm font-medium text-slate-800">{n?.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n?.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
