import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travellerTrip, travellerReadiness, travellerCommunications, travellerMe, optOutOfTrip } from '../../services/traveller';
import { MapPin, Calendar, CheckCircle, AlertCircle, MessageSquare, ChevronRight, LogOut } from 'lucide-react';

export default function TravellerDashboard() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [showOptOut, setShowOptOut] = useState(false);
  const [optOutReason, setOptOutReason] = useState('');
  const [optingOut, setOptingOut] = useState(false);

  async function loadAll() {
    const [t, r, m, profile] = await Promise.all([
      travellerTrip().catch(() => null),
      travellerReadiness().catch(() => null),
      travellerCommunications().catch(() => []),
      travellerMe().catch(() => null),
    ]);
    setTrip(t);
    setReadiness(r);
    setMessages(Array.isArray(m) ? m : []);
    setMe(profile);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleOptOut() {
    setOptingOut(true);
    try {
      await optOutOfTrip(optOutReason || undefined);
      setShowOptOut(false);
      await loadAll();
    } catch {}
    setOptingOut(false);
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;

  const unread = messages.filter((m: any) => m.read_status === 'UNREAD').length;

  return (
    <div className="space-y-4">
      {/* Opted-out banner */}
      {me?.membership_status === 'OPTED_OUT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">You have opted out of this trip</p>
            {me.opt_out_reason && <p className="text-xs text-amber-600 mt-0.5">Reason: {me.opt_out_reason}</p>}
            <p className="text-xs text-amber-600 mt-1">Contact your trip organizer if you wish to rejoin.</p>
          </div>
        </div>
      )}

      {me?.membership_status === 'REMOVED_BY_ORGANIZER' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">You have been removed from this trip</p>
            <p className="text-xs text-red-600 mt-1">Contact your trip organizer for more information.</p>
          </div>
        </div>
      )}

      {/* Trip info card */}
      {trip && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{trip.trip_name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <MapPin size={14} /> {trip.origin_city ? `${trip.origin_city} → ${trip.destination}` : trip.destination}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl px-3 py-2">
              <p className="text-xs text-blue-600 font-medium">Start</p>
              <p className="text-sm font-semibold text-gray-900">{trip.start_date}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-3 py-2">
              <p className="text-xs text-blue-600 font-medium">End</p>
              <p className="text-sm font-semibold text-gray-900">{trip.end_date}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">{trip.days} days</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${trip.status === 'READY_TO_DEPART' || trip.status === 'IN_PROGRESS' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {trip.status?.replace(/_/g, ' ')}
            </span>
          </div>
          {me?.membership_status === 'ACTIVE' && (
            <button onClick={() => setShowOptOut(true)} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition">
              <LogOut size={15} /> Opt Out of Trip
            </button>
          )}
        </div>
      )}

      {/* Readiness card — only show if documents not yet uploaded */}
      {readiness && !readiness.documents_completed && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer" onClick={() => navigate('/traveller/documents')}>
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Document upload is pending</p>
              <p className="text-xs text-gray-500 mt-0.5">Tap here to upload your documents.</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" /> Messages
          </h3>
          {unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">{unread}</span>}
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">No messages yet.</p>
        ) : (
          <div className="space-y-2">
            {messages.slice(0, 3).map((m: any) => (
              <button key={m.communication_id} onClick={() => navigate('/traveller/communications')} className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.read_status === 'UNREAD' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400 truncate">{m.message?.substring(0, 60)}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        )}
        {messages.length > 3 && (
          <button onClick={() => navigate('/traveller/communications')} className="text-xs text-blue-600 font-medium mt-2">View all →</button>
        )}
      </div>

      {/* Opt Out Confirmation Modal */}
      {showOptOut && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:px-4" onClick={() => setShowOptOut(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Opt Out of Trip?</h2>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to opt out? This action cannot be undone by you. Contact your organizer to rejoin.</p>
            <textarea
              placeholder="Reason (optional)"
              value={optOutReason}
              onChange={(e) => setOptOutReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm mb-4 resize-none focus:ring-2 focus:ring-red-300 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleOptOut} disabled={optingOut} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50">
                {optingOut ? 'Processing...' : 'Confirm Opt Out'}
              </button>
              <button onClick={() => setShowOptOut(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
