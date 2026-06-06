import { useState, useEffect, useRef } from 'react';
import { FolderOpen, Plus, Trash2, Users, X, UserPlus, Upload } from 'lucide-react';
import { listGroups, createGroup, deleteGroup, getGroupDetail, removeGroupMember, createTravellerInGroup, importCsvIntoGroup } from '../services/directory';

interface Group { group_id: string; name: string; description?: string; member_count: number; created_at?: string; }
interface Member { master_id: string; first_name: string; last_name: string; phone?: string; email?: string; }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddTraveller, setShowAddTraveller] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', phone: '', email: '', gender: '' });
  const [saving, setSaving] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { const r = await listGroups(); setGroups(r.data); } catch { setGroups([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    await createGroup(form);
    setShowCreate(false);
    setForm({ name: '', description: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await deleteGroup(id);
    if (selected === id) { setSelected(null); setMembers([]); }
    load();
  };

  const selectGroup = async (id: string) => {
    setSelected(id);
    const g = groups.find(x => x.group_id === id);
    setSelectedName(g?.name || '');
    try {
      const r = await getGroupDetail(id);
      setMembers(r.data.members || []);
    } catch { setMembers([]); }
  };

  const handleAddTraveller = async () => {
    if (!selected || !addForm.first_name || !addForm.last_name) return;
    setSaving(true);
    try {
      await createTravellerInGroup(selected, addForm);
      setAddForm({ first_name: '', last_name: '', phone: '', email: '', gender: '' });
      setShowAddTraveller(false);
      selectGroup(selected);
      load();
    } catch { alert('Failed to add traveller'); }
    setSaving(false);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    try {
      const res = await importCsvIntoGroup(selected, file);
      alert(`Imported ${res.data.successful} travellers into group. ${res.data.failed} errors.`);
      selectGroup(selected);
      load();
    } catch { alert('CSV import failed'); }
    if (csvRef.current) csvRef.current.value = '';
  };

  const handleRemoveMember = async (masterId: string) => {
    if (!selected) return;
    await removeGroupMember(selected, masterId);
    selectGroup(selected);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Groups</h1>
          <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">{groups.length} groups</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group List */}
        <div className="lg:col-span-1">
          {loading ? <p className="text-gray-500">Loading...</p> : groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No groups yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(g => (
                <div
                  key={g.group_id}
                  onClick={() => selectGroup(g.group_id)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${selected === g.group_id ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{g.name}</p>
                      {g.description && <p className="text-xs text-gray-500 mt-1">{g.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{g.member_count} members</span>
                      <button onClick={e => { e.stopPropagation(); handleDelete(g.group_id); }} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{selectedName} — {members.length} members</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddTraveller(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1">
                    <UserPlus className="w-4 h-4" /> Add Traveller
                  </button>
                  <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1 cursor-pointer hover:bg-gray-200">
                    <Upload className="w-4 h-4" /> Import CSV
                    <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                  </label>
                </div>
              </div>

              {/* Inline Add Traveller Form */}
              {showAddTraveller && (
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium text-sm">Add New Traveller to {selectedName}</p>
                    <button onClick={() => setShowAddTraveller(false)}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded p-2 text-sm" placeholder="First Name *" value={addForm.first_name} onChange={e => setAddForm({ ...addForm, first_name: e.target.value })} />
                    <input className="border rounded p-2 text-sm" placeholder="Last Name *" value={addForm.last_name} onChange={e => setAddForm({ ...addForm, last_name: e.target.value })} />
                    <input className="border rounded p-2 text-sm" placeholder="Phone" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                    <input className="border rounded p-2 text-sm" placeholder="Email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                  </div>
                  <button onClick={handleAddTraveller} disabled={saving || !addForm.first_name || !addForm.last_name} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                    {saving ? 'Adding...' : 'Add to Group'}
                  </button>
                </div>
              )}

              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No members. Import a CSV or add travellers directly above.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map(m => (
                      <tr key={m.master_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{m.first_name} {m.last_name}</td>
                        <td className="px-3 py-2 text-gray-600">{m.phone || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{m.email || '-'}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => handleRemoveMember(m.master_id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p>Select a group to view members</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Group</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5" /></button>
            </div>
            <input className="w-full border rounded p-2 mb-3" placeholder="Group Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="w-full border rounded p-2 mb-4" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button onClick={handleCreate} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
