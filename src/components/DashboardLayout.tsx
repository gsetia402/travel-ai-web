import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 pt-14 lg:pt-0 lg:ml-56 p-4 sm:p-6 lg:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
