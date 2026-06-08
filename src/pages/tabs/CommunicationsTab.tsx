import { useEffect, useState } from 'react';
import { getCommunications, getCommunicationSummary, sendCommunication, getAIWeather } from '../../services/tripops';
import { Send, Mail, Eye, EyeOff, CloudSun, Compass, Check, RefreshCw, Sparkles } from 'lucide-react';

export default function CommunicationsTab({ tripId, trip }: { tripId: string; trip?: { destination: string; days: number } }) {
  const [comms, setComms] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const [c, s] = await Promise.all([getCommunications(tripId), getCommunicationSummary(tripId)]);
      setComms(c.data);
      setSummary(s.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);
    try {
      await sendCommunication(tripId, { title, message, audience_type: 'ALL_TRAVELLERS' });
      setTitle('');
      setMessage('');
      setShowForm(false);
      await load();
    } catch {}
    setSending(false);
  }

  if (loading) return <div className="text-gray-500">Loading communications...</div>;

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <Mail size={16} className="mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{summary.total_messages}</p>
            <p className="text-xs text-gray-500">Messages</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <Eye size={16} className="mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{summary.read_percentage}%</p>
            <p className="text-xs text-gray-500">Read</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <EyeOff size={16} className="mx-auto mb-1 text-yellow-600" />
            <p className="text-lg font-bold">{(100 - summary.read_percentage).toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Unread</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Messages</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Send size={14} /> New Message
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSend} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send to All Travellers'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {comms.map((c) => (
          <div key={c.communication_id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{c.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{c.message}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                {c.recipient_count} recipients
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-xs text-gray-500">
              <span>{c.audience_type}</span>
              <span>&middot;</span>
              <span>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {comms.length === 0 && <p className="text-gray-500">No messages sent yet.</p>}
      </div>

      {/* AI-Powered: Weather + Travel Advice */}
      {trip && <WeatherAndAdvice tripId={tripId} trip={trip} onRefresh={load} />}
    </div>
  );
}

function WeatherAndAdvice({ tripId, trip, onRefresh }: { tripId: string; trip: { destination: string; days: number }; onRefresh: () => void }) {
  const [weather, setWeather] = useState<any>(null);
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function fetchWeather() {
    setLoadingWeather(true);
    try {
      const { data } = await getAIWeather({ destination: trip.destination });
      setWeather(data);
    } catch {}
    setLoadingWeather(false);
  }

  async function fetchAdvice() {
    setLoadingAdvice(true);
    setSent(false);
    try {
      const { data } = await getAIWeather({ destination: trip.destination });
      const tips: string[] = [];
      if (data.temperature > 30) tips.push('Pack light, breathable clothing and stay hydrated.');
      else if (data.temperature < 15) tips.push('Bring warm layers, a jacket, and thermal wear.');
      else tips.push('Pack comfortable clothing for moderate weather.');
      if (data.condition?.toLowerCase().includes('rain')) tips.push('Carry an umbrella and waterproof shoes.');
      tips.push(`Weather in ${trip.destination}: ${data.condition}, ${data.temperature}°C — ${data.recommendation}`);
      tips.push(`For a ${trip.days}-day trip, pack ${Math.min(trip.days, 5)} sets of outfits.`);
      tips.push('Carry a first-aid kit, sunscreen, and any required medications.');
      tips.push('Keep digital copies of all travel documents.');
      setAdvice(tips);
      if (!weather) setWeather(data);
    } catch {
      setAdvice(['Unable to generate advice at this time.']);
    }
    setLoadingAdvice(false);
  }

  async function handleSendToAll() {
    if (!advice || advice.length === 0) return;
    setSending(true);
    try {
      const message = advice.map((tip, i) => `${i + 1}. ${tip}`).join('\n');
      await sendCommunication(tripId, { title: `Travel Advisory — ${trip.destination}`, message, audience_type: 'ALL_TRAVELLERS' });
      setSent(true);
      onRefresh();
    } catch {}
    setSending(false);
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <Sparkles size={14} className="text-purple-500" /> AI-Powered Insights
      </h3>

      {/* Weather Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CloudSun size={16} className="text-sky-600" />
            <h4 className="font-medium text-gray-900 text-sm">Weather Summary</h4>
          </div>
          <button onClick={fetchWeather} disabled={loadingWeather} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50">
            {loadingWeather ? <><RefreshCw size={13} className="animate-spin" /> Loading...</> : 'Get Weather'}
          </button>
        </div>
        {weather && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{weather.temperature}°C</p>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{weather.condition}</p>
                <p className="text-xs text-gray-500">Conditions</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-gray-700">{weather.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Travel Advice */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-amber-600" />
            <h4 className="font-medium text-gray-900 text-sm">Travel Advice</h4>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAdvice} disabled={loadingAdvice} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {loadingAdvice ? 'Loading...' : 'Get Advice'}
            </button>
            {advice && advice.length > 0 && (
              <button onClick={handleSendToAll} disabled={sending || sent} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${sent ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-60`}>
                {sent ? <><Check size={13} /> Sent to All</> : sending ? <><RefreshCw size={13} className="animate-spin" /> Sending...</> : <><Send size={13} /> Send to All Travellers</>}
              </button>
            )}
          </div>
        </div>
        {advice && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {advice.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
