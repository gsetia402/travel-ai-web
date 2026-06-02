import { useEffect, useState } from 'react';
import { getCommunications, getCommunicationSummary, sendCommunication } from '../../services/tripops';
import { Send, Mail, Eye, EyeOff } from 'lucide-react';

export default function CommunicationsTab({ tripId }: { tripId: string }) {
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
    </div>
  );
}
