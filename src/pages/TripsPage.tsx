import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getTripSummary } from '../services/tripops';
import { MapPin, Users, DollarSign, Percent } from 'lucide-react';

interface TripCard {
  trip_id: string;
  trip_name: string;
  destination: string;
  traveller_count: number;
  budget: number;
  registrationPct: number;
  readinessPct: number;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTrips();
        const enriched: TripCard[] = [];
        for (const t of data) {
          let regPct = 0, readyPct = 0;
          try {
            const { data: s } = await getTripSummary(t.trip_id);
            regPct = s.traveller_count > 0 ? Math.round((s.registered_travellers / s.traveller_count) * 100) : 0;
            readyPct = s.trip_ready_percentage || 0;
          } catch {}
          enriched.push({ ...t, registrationPct: regPct, readinessPct: readyPct });
        }
        setTrips(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading trips...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trips</h1>
      {trips.length === 0 ? (
        <p className="text-gray-500">No trips found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.trip_id}
              to={`/trips/${trip.trip_id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{trip.trip_name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <MapPin size={14} /> {trip.destination}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users size={14} /> {trip.traveller_count}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <DollarSign size={14} /> ₹{(trip.budget / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Percent size={14} /> Reg: {trip.registrationPct}%
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Percent size={14} /> Ready: {trip.readinessPct}%
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
