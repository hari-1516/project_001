import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Camera, FileText, Settings, LogOut, Shield, Menu, X, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/register-student', name: 'Register', icon: UserPlus },
  { path: '/attendance', name: 'Attendance', icon: Camera },
  { path: '/reports', name: 'Reports', icon: FileText },
  { path: '/live-attendance', name: 'Live Attendance', icon: Radio },
  { path: '/admin', name: 'Admin', icon: Shield, adminOnly: true },
  { path: '/settings', name: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          VisionAttend AI
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Smart Attendance System</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map(({ path, name, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-2.5 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex-col">
        {navContent}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-white h-full flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
