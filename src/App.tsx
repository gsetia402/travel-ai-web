import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import TripsPage from './pages/TripsPage';
import TripDetailsPage from './pages/TripDetailsPage';
import TravellersPage from './pages/TravellersPage';
import RoomsPage from './pages/RoomsPage';
import DocumentsPage from './pages/DocumentsPage';
import FinancialsPage from './pages/FinancialsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import AIPlannerPage from './pages/AIPlannerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
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
