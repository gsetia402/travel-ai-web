import { useEffect, useState } from 'react';
import { getTrips, getRooms } from '../services/tripops';
import { BedDouble } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: trips } = await getTrips();
        const all: any[] = [];
        for (const trip of trips) {
          try {
            const { data } = await getRooms(trip.trip_id);
            all.push(...data.map((r: any) => ({ ...r, trip_name: trip.trip_name })));
          } catch {}
        }
        setRooms(all);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading rooms...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Rooms</h1>
      {rooms.length === 0 ? (
        <p className="text-gray-500">No rooms allocated yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.room_id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <BedDouble size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Room {room.room_number}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-2">{room.trip_name} &middot; {room.room_type}</p>
              <p className="text-sm text-gray-600">{room.occupants?.length || 0} / {room.capacity} occupants</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
