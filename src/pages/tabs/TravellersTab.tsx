import { useEffect, useState, useRef } from 'react';
import { getTravellers, getTravellerReadiness, createTraveller, uploadTravellersCsv } from '../../services/tripops';
import { CheckCircle, XCircle, Plus, Upload, Download, X } from 'lucide-react';

interface Traveller {
  traveller_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  participation_status: string | null;
  ready?: boolean;
}

const emptyForm = { first_name: '', last_name: '', phone: '', email: '' };

export default function TravellersTab({ tripId }: { tripId: string }) {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [filter, setFilter] = useState<'all' | 'ready' | 'not_ready' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTravellers(tripId);
      const enriched = await Promise.all(
        data.map(async (t: any) => {
          let ready = false;
          try {
            const { data: r } = await getTravellerReadiness(t.traveller_id);
            ready = r.trip_ready;
          } catch {}
          return { ...t, ready };
        })
      );
      setTravellers(enriched);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createTraveller(tripId, form);
      setForm(emptyForm);
      setShowAdd(false);
      await load();
    } catch {}
    setSaving(false);
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadTravellersCsv(tripId, file);
      await load();
    } catch {}
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleExport() {
    const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Ready'];
    const rows = travellers.map((t) => [
      t.first_name, t.last_name, t.phone, t.email || '', t.participation_status || 'INVITED', t.ready ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travellers-${tripId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = travellers.filter((t) => {
    if (filter === 'ready') return t.ready;
    if (filter === 'not_ready') return !t.ready;
    if (filter === 'pending') return t.participation_status === 'INVITED';
    return true;
  });

  if (loading) return <div className="text-gray-500">Loading travellers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {(['all', 'ready', 'not_ready', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'ready' ? 'Ready' : f === 'not_ready' ? 'Not Ready' : 'Pending Consent'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={13} /> Add Traveller
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 cursor-pointer">
            <Upload size={13} /> CSV Upload
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900 text-sm">Add Traveller</h4>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            <input placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="col-span-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Traveller'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Readiness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.traveller_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.participation_status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                    t.participation_status === 'DECLINED' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {t.participation_status || 'INVITED'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.ready ? (
                    <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Ready</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500"><XCircle size={14} /> Not Ready</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-6">No travellers match filter.</p>}
      </div>
    </div>
  );
}
