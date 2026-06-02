import { useEffect, useState } from 'react';
import { getRegistrationLink, getRegistrationSummary } from '../../services/tripops';
import { Link2, Users, UserPlus } from 'lucide-react';

export default function RegistrationTab({ tripId }: { tripId: string }) {
  const [link, setLink] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [l, s] = await Promise.all([
          getRegistrationLink(tripId).catch(() => null),
          getRegistrationSummary(tripId),
        ]);
        if (l) setLink(l.data);
        setSummary(s.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <div className="text-gray-500">Loading registration...</div>;

  return (
    <div>
      {link && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Registration Link</h3>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
              /register/{link.registration_code}
            </code>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              link.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {link.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      {!link && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-700">
          No registration link generated for this trip.
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <Users size={20} className="mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{summary.total_registered}</p>
            <p className="text-sm text-gray-500">Registered</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <UserPlus size={20} className="mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-gray-900">{summary.pending_registrations}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
              <span className="text-blue-600 font-bold text-sm">{summary.registration_completion_percentage}%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.registration_completion_percentage}%</p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
        </div>
      )}
    </div>
  );
}
