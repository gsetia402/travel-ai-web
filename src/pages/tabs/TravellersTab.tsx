import { useEffect, useState } from 'react';
import { getTravellers, getTravellerReadiness } from '../../services/tripops';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Traveller {
  traveller_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  participation_status: string | null;
  ready?: boolean;
}

export default function TravellersTab({ tripId }: { tripId: string }) {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [filter, setFilter] = useState<'all' | 'ready' | 'not_ready' | 'pending'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTravellers(tripId);
        const enriched = await Promise.all(
          data.map(async (t: any) => {
            let ready = false;
            try {
              const { data: r } = await getTravellerReadiness(t.traveller_id);
              ready = r.trip_ready;
            } catch {}
            return { ...t, ready };
          })
        );
        setTravellers(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  const filtered = travellers.filter((t) => {
    if (filter === 'ready') return t.ready;
    if (filter === 'not_ready') return !t.ready;
    if (filter === 'pending') return t.participation_status === 'INVITED';
    return true;
  });

  if (loading) return <div className="text-gray-500">Loading travellers...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'ready', 'not_ready', 'pending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'ready' ? 'Ready' : f === 'not_ready' ? 'Not Ready' : 'Pending Consent'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Readiness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.traveller_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.participation_status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                    t.participation_status === 'DECLINED' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {t.participation_status || 'INVITED'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.ready ? (
                    <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Ready</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500"><XCircle size={14} /> Not Ready</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-6">No travellers match filter.</p>}
      </div>
    </div>
  );
}
