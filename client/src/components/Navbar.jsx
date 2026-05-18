import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/register-student': 'Register Student',
  '/attendance': 'Attendance Capture',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'VisionAttend AI';

  return (
    <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Page Title */}
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 w-48"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
