import { useEffect, useState } from 'react';
import { getTripItinerary, saveTripItinerary, updateTripItinerary, generateAIItinerary } from '../../services/tripops';
import { Plus, Pencil, Trash2, X, Save, Sun, CloudSun, Moon, Sparkles, RefreshCw, Check } from 'lucide-react';

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

export default function ItineraryTab({ tripId, trip }: { tripId: string; trip?: { destination: string; days: number; budget: number } }) {
  const [days, setDays] = useState<DayItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editActivity, setEditActivity] = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const [actForm, setActForm] = useState({ time_of_day: 'Morning', activity: '', description: '' });
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

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

  async function handleAIGenerate() {
    if (!trip) return;
    setAiGenerating(true);
    setAiSaved(false);
    try {
      const { data } = await generateAIItinerary({ destination: trip.destination, days: trip.days, budget: trip.budget });
      setAiResult(data);
    } catch {}
    setAiGenerating(false);
  }

  async function handleAISave() {
    if (!aiResult?.itinerary) return;
    setAiSaving(true);
    try {
      const newDays = aiResult.itinerary.map((d: any) => ({
        day: d.day,
        title: `Day ${d.day}`,
        activities: (d.activities || []).map((a: string, i: number) => {
          const timeSlots = ['Morning', 'Afternoon', 'Evening'];
          let time_of_day = timeSlots[i] || 'Morning';
          let activity = a;
          for (const slot of timeSlots) {
            if (a.startsWith(slot + ':')) { time_of_day = slot; activity = a.substring(slot.length + 1).trim(); break; }
          }
          return { time_of_day, activity };
        }),
      }));
      await saveTripItinerary(tripId, { days: newDays });
      setAiSaved(true);
      setDays(newDays);
      setHasSaved(true);
    } catch {}
    setAiSaving(false);
  }

  if (loading) return <div className="text-gray-500">Loading itinerary...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Itinerary</h3>
        <div className="flex gap-2">
          {trip && (
            <button onClick={handleAIGenerate} disabled={aiGenerating} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {aiGenerating ? <><RefreshCw size={13} className="animate-spin" /> Generating...</> : <><Sparkles size={13} /> AI Generate</>}
            </button>
          )}
          <button onClick={addDay} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
            <Plus size={13} /> Add Day
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={13} /> {saving ? 'Saving...' : 'Save Itinerary'}
          </button>
        </div>
      </div>

      {/* AI Generated Preview */}
      {aiResult?.itinerary && !aiSaved && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">AI-Generated Itinerary</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAISave} disabled={aiSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {aiSaving ? <><RefreshCw size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> Save to Trip</>}
              </button>
              <button onClick={handleAIGenerate} disabled={aiGenerating} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                <RefreshCw size={13} /> Regenerate
              </button>
              <button onClick={() => setAiResult(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {aiResult.itinerary.map((d: any) => (
              <div key={d.day} className="bg-white rounded-lg p-3 border border-purple-100">
                <p className="text-xs font-semibold text-gray-700 mb-1">Day {d.day}</p>
                <ul className="space-y-0.5">
                  {(d.activities || []).map((a: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600">• {a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiSaved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Check size={14} className="text-green-600" />
          <span className="text-sm text-green-700 font-medium">AI itinerary saved to trip successfully!</span>
          <button onClick={() => { setAiSaved(false); setAiResult(null); }} className="ml-auto text-xs text-green-600 hover:underline">Dismiss</button>
        </div>
      )}

      {days.length === 0 && !aiResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-3">No itinerary yet. Add days manually or use AI Generate above.</p>
          <div className="flex gap-2 justify-center">
            {trip && <button onClick={handleAIGenerate} disabled={aiGenerating} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"><Sparkles size={14} className="inline mr-1" />AI Generate</button>}
            <button onClick={addDay} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Day 1</button>
          </div>
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
