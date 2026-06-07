import { useEffect, useState } from 'react';
import { getTripsOverview } from '../services/tripops';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function CommunicationsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTripsOverview();
        const enriched = data.map((trip: any) => ({
          ...trip,
          comm: { total_messages: 0, read_percentage: 0 },
        }));
        setTrips(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading communications...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Communications</h1>
      <div className="space-y-3">
        {trips.map((trip) => (
          <Link
            key={trip.trip_id}
            to={`/trips/${trip.trip_id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{trip.trip_name}</h3>
                  <p className="text-xs text-gray-500">{trip.destination}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">{trip.comm.total_messages} messages</span>
                <span className="text-green-600">{trip.comm.read_percentage}% read</span>
              </div>
            </div>
          </Link>
        ))}
        {trips.length === 0 && <p className="text-gray-500">No trips found.</p>}
      </div>
    </div>
  );
}
