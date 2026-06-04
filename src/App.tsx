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
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicRegisterPage from './pages/PublicRegisterPage';
import TravellerLoginPage from './pages/traveller/TravellerLoginPage';
import TravellerLayout from './pages/traveller/TravellerLayout';
import TravellerDashboard from './pages/traveller/TravellerDashboard';
import TravellerItinerary from './pages/traveller/TravellerItinerary';
import TravellerDocuments from './pages/traveller/TravellerDocuments';
import TravellerRoom from './pages/traveller/TravellerRoom';
import TravellerCommunications from './pages/traveller/TravellerCommunications';
import TravellerProfile from './pages/traveller/TravellerProfile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/:code" element={<PublicRegisterPage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/travellers" element={<TravellersPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/financials" element={<FinancialsPage />} />
        <Route path="/communications" element={<CommunicationsPage />} />
      </Route>
      {/* Traveller Portal */}
      <Route path="/traveller/login" element={<TravellerLoginPage />} />
      <Route path="/traveller" element={<TravellerLayout />}>
        <Route path="dashboard" element={<TravellerDashboard />} />
        <Route path="itinerary" element={<TravellerItinerary />} />
        <Route path="documents" element={<TravellerDocuments />} />
        <Route path="room" element={<TravellerRoom />} />
        <Route path="communications" element={<TravellerCommunications />} />
        <Route path="profile" element={<TravellerProfile />} />
      </Route>
    </Routes>
  );
}
