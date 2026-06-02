import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Users,
  BedDouble,
  FileText,
  DollarSign,
  MessageSquare,
  Brain,
  LogOut,
} from 'lucide-react';
import { getUser, logout } from '../services/auth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips', icon: Map, label: 'Trips' },
  { to: '/travellers', icon: Users, label: 'Travellers' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/financials', icon: DollarSign, label: 'Financials' },
  { to: '/communications', icon: MessageSquare, label: 'Communications' },
  { to: '/ai-planner', icon: Brain, label: 'AI Planner' },
];

export default function Sidebar() {
  const user = getUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 text-gray-300 flex flex-col z-40">
      <div className="px-5 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white tracking-tight">TripOps</h1>
        <p className="text-xs text-gray-500 mt-0.5">{user?.organization_name || 'Coordinator Dashboard'}</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white border-l-2 border-blue-500'
                  : 'hover:bg-gray-800/50 hover:text-white border-l-2 border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
