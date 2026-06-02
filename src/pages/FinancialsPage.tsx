import { useEffect, useState } from 'react';
import { getTrips, getFinancialSummary } from '../services/tripops';
import { Link } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export default function FinancialsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTrips();
        const enriched = await Promise.all(
          data.map(async (trip: any) => {
            let fin = { total_budget: trip.budget, amount_spent: 0, remaining_budget: trip.budget };
            try {
              const { data: s } = await getFinancialSummary(trip.trip_id);
              fin = s;
            } catch {}
            return { ...trip, fin };
          })
        );
        setTrips(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading financials...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Financials</h1>
      <div className="space-y-3">
        {trips.map((trip) => (
          <Link
            key={trip.trip_id}
            to={`/trips/${trip.trip_id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{trip.trip_name}</h3>
                  <p className="text-xs text-gray-500">{trip.destination}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">₹{(trip.fin.total_budget / 1000).toFixed(0)}K budget</span>
                <span className="text-red-600">₹{((trip.fin.amount_spent || trip.fin.total_spent || 0) / 1000).toFixed(0)}K spent</span>
                <span className="text-green-600">₹{((trip.fin.remaining_budget || trip.fin.remaining || 0) / 1000).toFixed(0)}K left</span>
              </div>
            </div>
          </Link>
        ))}
        {trips.length === 0 && <p className="text-gray-500">No trips found.</p>}
      </div>
    </div>
  );
}
