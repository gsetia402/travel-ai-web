import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getTravellerToken, clearTravellerToken, travellerMe, TravellerUser } from '../../services/traveller';
import { Home, FileText, Map, BedDouble, MessageSquare, User, LogOut } from 'lucide-react';

const navItems = [
  { path: '/traveller/dashboard', icon: Home, label: 'Home' },
  { path: '/traveller/itinerary', icon: Map, label: 'Itinerary' },
  { path: '/traveller/documents', icon: FileText, label: 'Docs' },
  { path: '/traveller/room', icon: BedDouble, label: 'Room' },
  { path: '/traveller/communications', icon: MessageSquare, label: 'Messages' },
  { path: '/traveller/profile', icon: User, label: 'Profile' },
];

export default function TravellerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<TravellerUser | null>(null);

  useEffect(() => {
    const token = getTravellerToken();
    if (!token) { navigate('/traveller/login'); return; }
    travellerMe().then(setUser).catch(() => {
      clearTravellerToken();
      navigate('/traveller/login');
    });
  }, []);

  function handleLogout() {
    clearTravellerToken();
    navigate('/traveller/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">TripOps</h1>
            {user && <p className="text-xs text-gray-500">{user.first_name} {user.last_name}</p>}
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet context={{ user }} />
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="hidden sm:block fixed top-14 left-0 w-56 h-full bg-white border-r border-gray-200 z-30 p-4">
        <div className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
