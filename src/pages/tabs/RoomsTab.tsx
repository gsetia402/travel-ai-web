import { useEffect, useState } from 'react';
import { getRooms } from '../../services/tripops';
import { BedDouble } from 'lucide-react';

export default function RoomsTab({ tripId }: { tripId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getRooms(tripId);
        setRooms(data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <div className="text-gray-500">Loading rooms...</div>;

  if (rooms.length === 0) return <p className="text-gray-500">No rooms allocated yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <div key={room.room_id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BedDouble size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Room {room.room_number}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-2">{room.room_type} &middot; Capacity {room.capacity}</p>
          <div className="space-y-1">
            {room.occupants?.map((o: any) => (
              <p key={o.traveller_id} className="text-sm text-gray-700">{o.first_name} {o.last_name}</p>
            ))}
            {(!room.occupants || room.occupants.length === 0) && (
              <p className="text-sm text-gray-400 italic">No occupants</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
