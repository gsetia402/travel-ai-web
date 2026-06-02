import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Map,
  Users,
  BedDouble,
  FileText,
  DollarSign,
  MessageSquare,
  LogOut,
  Menu,
  X,
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
];

export default function Sidebar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">TripOps</h1>
          <p className="text-xs text-gray-500 mt-0.5">{user?.organization_name || 'Coordinator Dashboard'}</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
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
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 flex items-center px-4 z-50 border-b border-gray-800">
        <button onClick={() => setOpen(true)} className="text-white p-2 -ml-2 rounded-lg hover:bg-gray-800" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className="text-base font-bold text-white ml-3">TripOps</h1>
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar: mobile = slide-over drawer, desktop = permanent */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-gray-900 text-gray-300 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:w-56
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
