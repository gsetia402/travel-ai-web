import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import TripsPage from './pages/TripsPage';
import TripDetailsPage from './pages/TripDetailsPage';
import TravellersPage from './pages/TravellersPage';
import RoomsPage from './pages/RoomsPage';
import DocumentsPage from './pages/DocumentsPage';
import FinancialsPage from './pages/FinancialsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import AIPlannerPage from './pages/AIPlannerPage';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/travellers" element={<TravellersPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/financials" element={<FinancialsPage />} />
        <Route path="/communications" element={<CommunicationsPage />} />
        <Route path="/ai-planner" element={<AIPlannerPage />} />
      </Route>
    </Routes>
  );
}
