import { useEffect, useState } from 'react';
import { travellerItinerary } from '../../services/traveller';
import { Map, Sun, Cloud, Moon } from 'lucide-react';

const TIME_ICONS: Record<string, any> = { Morning: Sun, Afternoon: Cloud, Evening: Moon };

export default function TravellerItinerary() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    travellerItinerary()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || 'Unable to load itinerary'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>;
  if (!data?.days?.length) return <div className="text-center text-gray-400 py-12"><Map size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No itinerary available yet.</p></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Map size={20} className="text-blue-600" /> Itinerary</h2>
      {data.days.map((day: any) => (
        <div key={day.day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800">Day {day.day}{day.title ? ` — ${day.title}` : ''}</h3>
          </div>
          <div className="p-4 space-y-3">
            {(day.activities || []).map((act: any, i: number) => {
              const Icon = TIME_ICONS[act.time_of_day] || Sun;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">{act.time_of_day}</p>
                    <p className="text-sm text-gray-800">{act.activity}</p>
                    {act.description && <p className="text-xs text-gray-400 mt-0.5">{act.description}</p>}
                  </div>
                </div>
              );
            })}
            {(!day.activities || day.activities.length === 0) && (
              <p className="text-sm text-gray-400 italic">No activities planned.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
