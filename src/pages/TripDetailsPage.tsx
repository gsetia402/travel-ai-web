import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTrip, getTripSummary } from '../services/tripops';
import TravellersTab from './tabs/TravellersTab';
import RoomsTab from './tabs/RoomsTab';
import DocumentsTab from './tabs/DocumentsTab';
import FinancialsTab from './tabs/FinancialsTab';
import CommunicationsTab from './tabs/CommunicationsTab';
import RegistrationTab from './tabs/RegistrationTab';

const tabs = ['Travellers', 'Rooms', 'Documents', 'Financials', 'Communications', 'Registration'];

export default function TripDetailsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Travellers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tripId) return;
      try {
        const [t, s] = await Promise.all([getTrip(tripId), getTripSummary(tripId)]);
        setTrip(t.data);
        setSummary(s.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <div className="text-gray-500">Loading trip...</div>;
  if (!trip) return <div className="text-red-500">Trip not found.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{trip.trip_name}</h1>
        <p className="text-sm text-gray-500">{trip.destination} &middot; {trip.days} days &middot; {trip.traveller_count} travellers</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Registered" value={summary.registered_travellers} />
          <Stat label="Pending" value={summary.pending_travellers} />
          <Stat label="Budget" value={`₹${(summary.total_budget / 1000).toFixed(0)}K`} />
          <Stat label="Ready" value={`${summary.trip_ready_percentage}%`} />
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'Travellers' && <TravellersTab tripId={tripId!} />}
        {activeTab === 'Rooms' && <RoomsTab tripId={tripId!} />}
        {activeTab === 'Documents' && <DocumentsTab tripId={tripId!} />}
        {activeTab === 'Financials' && <FinancialsTab tripId={tripId!} />}
        {activeTab === 'Communications' && <CommunicationsTab tripId={tripId!} />}
        {activeTab === 'Registration' && <RegistrationTab tripId={tripId!} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
