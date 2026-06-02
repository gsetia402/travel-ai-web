import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTrip, getTripSummary } from '../services/tripops';
import TravellersTab from './tabs/TravellersTab';
import RoomsTab from './tabs/RoomsTab';
import DocumentsTab from './tabs/DocumentsTab';
import FinancialsTab from './tabs/FinancialsTab';
import CommunicationsTab from './tabs/CommunicationsTab';
import RegistrationTab from './tabs/RegistrationTab';
import ItineraryTab from './tabs/ItineraryTab';
import AIAssistantTab from './tabs/AIAssistantTab';

const tabs = ['Overview', 'Travellers', 'Rooms', 'Documents', 'Financials', 'Communications', 'Registration', 'Itinerary', 'AI Assistant'];

export default function TripDetailsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [itineraryKey, setItineraryKey] = useState(0);

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

  function onItinerarySaved() {
    setItineraryKey((k) => k + 1);
  }

  if (loading) return <div className="text-gray-500">Loading trip...</div>;
  if (!trip) return <div className="text-red-500">Trip not found.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{trip.trip_name}</h1>
        <p className="text-sm text-gray-500">{trip.destination} &middot; {trip.days} days &middot; {trip.traveller_count} travellers &middot; ₹{(trip.budget / 1000).toFixed(0)}K budget</p>
      </div>

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
        <div style={{ display: activeTab === 'Overview' ? 'block' : 'none' }}><OverviewSection trip={trip} summary={summary} /></div>
        <div style={{ display: activeTab === 'Travellers' ? 'block' : 'none' }}><TravellersTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Rooms' ? 'block' : 'none' }}><RoomsTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Documents' ? 'block' : 'none' }}><DocumentsTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Financials' ? 'block' : 'none' }}><FinancialsTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Communications' ? 'block' : 'none' }}><CommunicationsTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Registration' ? 'block' : 'none' }}><RegistrationTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Itinerary' ? 'block' : 'none' }}><ItineraryTab key={itineraryKey} tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'AI Assistant' ? 'block' : 'none' }}><AIAssistantTab tripId={tripId!} trip={{ destination: trip.destination, days: trip.days, budget: trip.budget, traveller_count: trip.traveller_count }} onItinerarySaved={onItinerarySaved} /></div>
      </div>
    </div>
  );
}

function OverviewSection({ trip, summary }: { trip: any; summary: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Destination" value={trip.destination} />
        <Stat label="Duration" value={`${trip.days} days`} />
        <Stat label="Start Date" value={trip.start_date} />
        <Stat label="End Date" value={trip.end_date} />
      </div>
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Registered" value={summary.registered_travellers} />
          <Stat label="Pending" value={summary.pending_travellers} />
          <Stat label="Budget" value={`₹${(summary.total_budget / 1000).toFixed(0)}K`} />
          <Stat label="Ready" value={`${summary.trip_ready_percentage}%`} />
        </div>
      )}
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
