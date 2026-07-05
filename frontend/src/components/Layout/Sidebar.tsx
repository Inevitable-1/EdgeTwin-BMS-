import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Battery,
  Map,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fleet', href: '/fleet', icon: Map },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Passports', href: '/passport', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Battery className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">EdgeTwin</h1>
            <p className="text-dark-400 text-xs">BMS+ Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-500'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
            <span className="text-primary-500 font-medium text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-dark-400 text-xs truncate">{user?.role || 'viewer'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
