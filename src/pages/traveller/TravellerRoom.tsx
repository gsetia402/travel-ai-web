import { useEffect, useState } from 'react';
import { travellerRoom } from '../../services/traveller';
import { BedDouble, User } from 'lucide-react';

export default function TravellerRoom() {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    travellerRoom()
      .then(setRoom)
      .catch((e) => setError(e?.response?.data?.detail || 'Unable to load room details'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>;

  if (!room?.room_id) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BedDouble size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No room assigned yet.</p>
        <p className="text-xs text-gray-300 mt-1">Your coordinator will allocate rooms soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BedDouble size={20} className="text-purple-600" /> Room Assignment</h2>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Room #{room.room_number}</h3>
            <p className="text-sm text-gray-500">{room.room_type}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <BedDouble size={24} className="text-purple-600" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Occupants</p>
          <div className="space-y-3">
            {room.occupants?.map((o: any) => (
              <div key={o.traveller_id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.first_name} {o.last_name}</p>
                  {o.gender && <p className="text-xs text-gray-400">{o.gender}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
