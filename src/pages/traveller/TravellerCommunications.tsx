import { useEffect, useState } from 'react';
import { travellerCommunications, markCommunicationRead } from '../../services/traveller';
import { MessageSquare, Check } from 'lucide-react';

export default function TravellerCommunications() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { const m = await travellerCommunications(); setMessages(m); } catch (e: any) { setError(e?.response?.data?.detail || 'Unable to load'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRead(id: string) {
    setExpanded(expanded === id ? null : id);
    const msg = messages.find((m) => m.communication_id === id);
    if (msg && msg.read_status === 'UNREAD') {
      try {
        await markCommunicationRead(id);
        setMessages((prev) => prev.map((m) => m.communication_id === id ? { ...m, read_status: 'READ' } : m));
      } catch {}
    }
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>;

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No messages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare size={20} className="text-blue-600" /> Communications</h2>

      <div className="space-y-2">
        {messages.map((m: any) => (
          <div key={m.communication_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => handleRead(m.communication_id)} className="w-full text-left px-4 py-3 flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${m.read_status === 'UNREAD' ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${m.read_status === 'UNREAD' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{m.title}</p>
                <p className="text-xs text-gray-400">{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</p>
              </div>
              {m.read_status === 'READ' && <Check size={14} className="text-green-500 flex-shrink-0 mt-1" />}
            </button>
            {expanded === m.communication_id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
