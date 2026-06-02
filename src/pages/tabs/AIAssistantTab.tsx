import { useState } from 'react';
import { generateAIItinerary, getAIWeather, getAIBudget, saveTripItinerary } from '../../services/tripops';
import { Sparkles, CloudSun, DollarSign, Compass, Save, RefreshCw, Check } from 'lucide-react';

interface TripContext {
  destination: string;
  days: number;
  budget: number;
  traveller_count: number;
}

export default function AIAssistantTab({ tripId, trip }: { tripId: string; trip: TripContext }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-blue-600" />
          <h3 className="font-semibold text-blue-900 text-sm">AI Assistant</h3>
        </div>
        <p className="text-xs text-blue-700">
          Using trip context: <strong>{trip.destination}</strong> · {trip.days} days · ₹{(trip.budget / 1000).toFixed(0)}K budget · {trip.traveller_count} travellers
        </p>
      </div>

      <GenerateItinerary tripId={tripId} trip={trip} />
      <WeatherSummary trip={trip} />
      <BudgetEstimation trip={trip} />
      <TravelAdvice trip={trip} />
    </div>
  );
}

function GenerateItinerary({ tripId, trip }: { tripId: string; trip: TripContext }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function generate() {
    setLoading(true);
    setSaved(false);
    try {
      const { data } = await generateAIItinerary({ destination: trip.destination, days: trip.days, budget: trip.budget });
      setResult(data);
    } catch {}
    setLoading(false);
  }

  async function handleSave() {
    if (!result?.itinerary) return;
    try {
      const days = result.itinerary.map((d: any) => ({
        day: d.day,
        title: `Day ${d.day}`,
        activities: (d.activities || []).map((a: string, i: number) => ({
          time_of_day: i === 0 ? 'Morning' : i === 1 ? 'Afternoon' : 'Evening',
          activity: a,
        })),
      }));
      await saveTripItinerary(tripId, { days });
      setSaved(true);
    } catch {}
  }

  return (
    <Card title="Generate Itinerary" icon={Sparkles} iconColor="text-purple-600">
      <div className="flex gap-2 mb-3">
        <button onClick={generate} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {loading ? <><RefreshCw size={13} className="animate-spin" /> Generating...</> : <><Sparkles size={13} /> Generate</>}
        </button>
        {result && (
          <button onClick={handleSave} disabled={saved} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saved ? <><Check size={13} /> Saved to Trip</> : <><Save size={13} /> Save to Trip</>}
          </button>
        )}
        {result && !saved && (
          <button onClick={generate} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
            <RefreshCw size={13} /> Regenerate
          </button>
        )}
      </div>
      {result?.itinerary && (
        <div className="space-y-2">
          {result.itinerary.map((d: any) => (
            <div key={d.day} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Day {d.day}</p>
              <ul className="space-y-1">
                {(d.activities || []).map((a: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600">• {a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function WeatherSummary({ trip }: { trip: TripContext }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const { data } = await getAIWeather({ destination: trip.destination });
      setResult(data);
    } catch {}
    setLoading(false);
  }

  return (
    <Card title="Weather Summary" icon={CloudSun} iconColor="text-sky-600">
      <button onClick={fetch} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 mb-3">
        {loading ? 'Loading...' : 'Get Weather'}
      </button>
      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{result.temperature}°C</p>
              <p className="text-xs text-gray-500">Temperature</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{result.condition}</p>
              <p className="text-xs text-gray-500">Conditions</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-700">{result.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function BudgetEstimation({ trip }: { trip: TripContext }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const { data } = await getAIBudget({ destination: trip.destination, days: trip.days, budget: trip.budget });
      setResult(data);
    } catch {}
    setLoading(false);
  }

  return (
    <Card title="Budget Estimation" icon={DollarSign} iconColor="text-green-600">
      <button onClick={fetch} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 mb-3">
        {loading ? 'Estimating...' : 'Estimate Budget'}
      </button>
      {result?.cost_breakdown && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {[
              ['Stay', result.cost_breakdown.stay],
              ['Food', result.cost_breakdown.food],
              ['Transport', result.cost_breakdown.local_transport],
              ['Activities', result.cost_breakdown.activities],
              ['Miscellaneous', result.cost_breakdown.miscellaneous],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">₹{(val as number).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-semibold">
              <span>Total Estimated</span>
              <span className="text-gray-900">₹{result.cost_breakdown.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trip Budget</span>
              <span className="text-gray-900">₹{trip.budget.toLocaleString()}</span>
            </div>
            <div className={`text-xs font-medium mt-1 ${
              result.budget_status === 'Within Budget' ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.budget_status}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function TravelAdvice({ trip }: { trip: TripContext }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const { data } = await getAIWeather({ destination: trip.destination });
      const advice: string[] = [];
      if (data.temperature > 30) advice.push('Pack light, breathable clothing and stay hydrated.');
      else if (data.temperature < 15) advice.push('Bring warm layers, a jacket, and thermal wear.');
      else advice.push('Pack comfortable clothing for moderate weather.');

      if (data.condition?.toLowerCase().includes('rain')) advice.push('Carry an umbrella and waterproof shoes.');
      advice.push(`Weather in ${trip.destination}: ${data.condition}, ${data.temperature}°C — ${data.recommendation}`);
      advice.push(`For a ${trip.days}-day trip, pack ${Math.min(trip.days, 5)} sets of outfits.`);
      advice.push('Carry a first-aid kit, sunscreen, and any required medications.');
      advice.push('Keep digital copies of all travel documents.');
      setResult(advice);
    } catch {
      setResult(['Unable to generate advice at this time.']);
    }
    setLoading(false);
  }

  return (
    <Card title="Travel Advice" icon={Compass} iconColor="text-amber-600">
      <button onClick={fetch} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 mb-3">
        {loading ? 'Loading...' : 'Get Advice'}
      </button>
      {result && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {result.map((tip: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Card({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={iconColor} />
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}
