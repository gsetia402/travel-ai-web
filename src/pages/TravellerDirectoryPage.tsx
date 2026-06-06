import { useState, useEffect } from 'react';
import { Users, UserPlus, Upload, Search, Trash2, Edit, X } from 'lucide-react';
import { listMasterTravellers, createMasterTraveller, deleteMasterTraveller, importMasterTravellersCSV } from '../services/directory';

interface MasterTraveller {
  master_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  gender?: string;
  city?: string;
  nationality?: string;
  groups: string[];
}

export default function TravellerDirectoryPage() {
  const [travellers, setTravellers] = useState<MasterTraveller[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', gender: '', city: '', nationality: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMasterTravellers(search || undefined);
      setTravellers(res.data);
    } catch { setTravellers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name) return;
    await createMasterTraveller(form);
    setShowAdd(false);
    setForm({ first_name: '', last_name: '', phone: '', email: '', gender: '', city: '', nationality: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this traveller from directory?')) return;
    await deleteMasterTraveller(id);
    load();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importMasterTravellersCSV(file);
      alert(`Imported: ${res.data.successful} travellers, ${res.data.failed} errors`);
      load();
    } catch { alert('CSV import failed'); }
    e.target.value = '';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Traveller Directory</h1>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">{travellers.length} travellers</span>
        </div>
        <div className="flex gap-2">
          <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-1 text-sm">
            <Upload className="w-4 h-4" /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </label>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
            <UserPlus className="w-4 h-4" /> Add Traveller
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Traveller</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="First Name *" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              <input className="border rounded p-2" placeholder="Last Name *" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              <input className="border rounded p-2" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="border rounded p-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <select className="border rounded p-2" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input className="border rounded p-2" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <input className="border rounded p-2 col-span-2" placeholder="Nationality" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
            </div>
            <button onClick={handleCreate} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add to Directory</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : travellers.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No travellers in directory</p>
          <p className="text-sm">Add travellers manually or import via CSV</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Groups</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {travellers.map(t => (
                <tr key={t.master_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.first_name} {t.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.city || '-'}</td>
                  <td className="px-4 py-3">
                    {t.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.groups.map(g => (
                          <span key={g} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">{g}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.master_id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
