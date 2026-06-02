import { useEffect, useState } from 'react';
import { getTrips, getDocumentSummary } from '../services/tripops';
import { Link } from 'react-router-dom';

export default function DocumentsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTrips();
        const enriched = await Promise.all(
          data.map(async (trip: any) => {
            let docSummary = { required_documents: 0, uploaded_documents: 0, verified_documents: 0, missing_documents: 0 };
            try {
              const { data: s } = await getDocumentSummary(trip.trip_id);
              docSummary = s;
            } catch {}
            return { ...trip, docSummary };
          })
        );
        setTrips(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading documents...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documents Overview</h1>
      <div className="space-y-3">
        {trips.map((trip) => (
          <Link
            key={trip.trip_id}
            to={`/trips/${trip.trip_id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{trip.trip_name}</h3>
                <p className="text-xs text-gray-500">{trip.destination}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-600">{trip.docSummary.uploaded_documents} uploaded</span>
                <span className="text-green-600">{trip.docSummary.verified_documents} verified</span>
                <span className="text-red-500">{trip.docSummary.missing_documents} missing</span>
              </div>
            </div>
          </Link>
        ))}
        {trips.length === 0 && <p className="text-gray-500">No trips found.</p>}
      </div>
    </div>
  );
}
