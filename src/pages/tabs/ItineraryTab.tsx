import { useEffect, useState } from 'react';
import { getTripItinerary, saveTripItinerary, updateTripItinerary } from '../../services/tripops';
import { Plus, Pencil, Trash2, X, Save, Sun, CloudSun, Moon } from 'lucide-react';

interface Activity {
  time_of_day: string;
  activity: string;
  description?: string;
}

interface DayItinerary {
  day: number;
  title?: string;
  activities: Activity[];
}

const timeIcons: Record<string, any> = {
  Morning: Sun,
  Afternoon: CloudSun,
  Evening: Moon,
};
const timeColors: Record<string, string> = {
  Morning: 'text-yellow-500',
  Afternoon: 'text-orange-500',
  Evening: 'text-indigo-500',
};

export default function ItineraryTab({ tripId }: { tripId: string }) {
  const [days, setDays] = useState<DayItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editActivity, setEditActivity] = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const [actForm, setActForm] = useState({ time_of_day: 'Morning', activity: '', description: '' });
  const [addingDay, setAddingDay] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTripItinerary(tripId);
      setDays(data.days || []);
      setHasSaved(true);
    } catch {
      setDays([]);
      setHasSaved(false);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleSave() {
    setSaving(true);
    try {
      if (hasSaved) {
        await updateTripItinerary(tripId, { days });
      } else {
        await saveTripItinerary(tripId, { days });
        setHasSaved(true);
      }
    } catch {}
    setSaving(false);
  }

  function addDay() {
    setDays([...days, { day: days.length + 1, title: `Day ${days.length + 1}`, activities: [] }]);
  }

  function removeDay(idx: number) {
    const updated = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    setDays(updated);
  }

  function openAddActivity(dayIdx: number) {
    setAddingDay(dayIdx);
    setEditActivity(null);
    setActForm({ time_of_day: 'Morning', activity: '', description: '' });
  }

  function openEditActivity(dayIdx: number, actIdx: number) {
    const act = days[dayIdx].activities[actIdx];
    setEditActivity({ dayIdx, actIdx });
    setAddingDay(null);
    setActForm({ time_of_day: act.time_of_day, activity: act.activity, description: act.description || '' });
  }

  function saveActivity() {
    const newDays = [...days];
    if (editActivity) {
      newDays[editActivity.dayIdx].activities[editActivity.actIdx] = { ...actForm };
      setEditActivity(null);
    } else if (addingDay !== null) {
      newDays[addingDay].activities.push({ ...actForm });
      setAddingDay(null);
    }
    setDays(newDays);
    setActForm({ time_of_day: 'Morning', activity: '', description: '' });
  }

  function deleteActivity(dayIdx: number, actIdx: number) {
    const newDays = [...days];
    newDays[dayIdx].activities.splice(actIdx, 1);
    setDays(newDays);
  }

  if (loading) return <div className="text-gray-500">Loading itinerary...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Itinerary</h3>
        <div className="flex gap-2">
          <button onClick={addDay} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
            <Plus size={13} /> Add Day
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={13} /> {saving ? 'Saving...' : 'Save Itinerary'}
          </button>
        </div>
      </div>

      {days.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-3">No itinerary yet. Add days manually or use the AI Assistant to generate one.</p>
          <button onClick={addDay} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Day 1</button>
        </div>
      )}

      <div className="space-y-4">
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <h4 className="font-medium text-gray-900">Day {day.day}{day.title ? ` — ${day.title}` : ''}</h4>
              <div className="flex gap-1">
                <button onClick={() => openAddActivity(dayIdx)} className="p-1 text-gray-400 hover:text-blue-600"><Plus size={14} /></button>
                <button onClick={() => removeDay(dayIdx)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>

            {day.activities.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No activities. Click + to add one.</p>
            )}

            <div className="divide-y divide-gray-50">
              {day.activities.map((act, actIdx) => {
                const Icon = timeIcons[act.time_of_day] || Sun;
                return (
                  <div key={actIdx} className="flex items-start gap-3 px-4 py-3">
                    <Icon size={16} className={`mt-0.5 ${timeColors[act.time_of_day] || 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{act.activity}</p>
                      {act.description && <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>}
                      <span className="text-xs text-gray-400">{act.time_of_day}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditActivity(dayIdx, actIdx)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={12} /></button>
                      <button onClick={() => deleteActivity(dayIdx, actIdx)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(addingDay === dayIdx || (editActivity && editActivity.dayIdx === dayIdx)) && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <div className="flex gap-2 items-end">
                  <select value={actForm.time_of_day} onChange={(e) => setActForm({ ...actForm, time_of_day: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded text-xs">
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                  <input placeholder="Activity" value={actForm.activity} onChange={(e) => setActForm({ ...actForm, activity: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs" />
                  <input placeholder="Description (optional)" value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs" />
                  <button onClick={saveActivity} disabled={!actForm.activity} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                    {editActivity ? 'Update' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingDay(null); setEditActivity(null); }} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
