import { useEffect, useState } from 'react';
import { getTrips, getTravellers } from '../services/tripops';

export default function TravellersPage() {
  const [travellers, setTravellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: trips } = await getTrips();
        const all: any[] = [];
        for (const trip of trips) {
          try {
            const { data } = await getTravellers(trip.trip_id);
            all.push(...data.map((t: any) => ({ ...t, trip_name: trip.trip_name })));
          } catch {}
        }
        setTravellers(all);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading travellers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Travellers</h1>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trip</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {travellers.map((t) => (
              <tr key={t.traveller_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.trip_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.participation_status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>{t.participation_status || 'INVITED'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {travellers.length === 0 && <p className="text-center py-6 text-gray-400">No travellers found.</p>}
      </div>
    </div>
  );
}
