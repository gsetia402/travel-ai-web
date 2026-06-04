import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travellerTrip, travellerReadiness, travellerCommunications } from '../../services/traveller';
import { MapPin, Calendar, CheckCircle, AlertCircle, MessageSquare, ChevronRight } from 'lucide-react';

export default function TravellerDashboard() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      travellerTrip().catch(() => null),
      travellerReadiness().catch(() => null),
      travellerCommunications().catch(() => []),
    ]).then(([t, r, m]) => {
      setTrip(t);
      setReadiness(r);
      setMessages(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;

  const unread = messages.filter((m: any) => m.read_status === 'UNREAD').length;

  return (
    <div className="space-y-4">
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
    </div>
  );
}
