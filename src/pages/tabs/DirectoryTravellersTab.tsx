import { useState, useEffect } from 'react';
import { Users, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { listTripDirectoryTravellers, addGroupToTrip, removeTravellerFromTrip, listGroups } from '../../services/directory';

interface TripTraveller {
  id: string;
  trip_id: string;
  master_id: string;
  added_via?: string;
  added_at?: string;
  traveller?: { master_id: string; first_name: string; last_name: string; phone?: string; email?: string; groups: string[] };
}

interface Group { group_id: string; name: string; member_count: number; }

export default function DirectoryTravellersTab({ tripId }: { tripId: string }) {
  const [travellers, setTravellers] = useState<TripTraveller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await listTripDirectoryTravellers(tripId); setTravellers(r.data); } catch { setTravellers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tripId]);

  const openGroupPicker = async () => {
    try { const r = await listGroups(); setGroups(r.data); } catch { setGroups([]); }
    setShowGroups(true);
  };

  const handleAddGroup = async (groupId: string) => {
    setAdding(true);
    try {
      const res = await addGroupToTrip(tripId, groupId);
      alert(`Added ${res.data.added} travellers from group`);
      load();
    } catch { alert('Failed to add group'); }
    setAdding(false);
    setShowGroups(false);
  };

  const handleRemove = async (masterId: string) => {
    if (!confirm('Remove this traveller from the trip?')) return;
    await removeTravellerFromTrip(tripId, masterId);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Directory Travellers</h2>
          <span className="text-sm text-gray-500">({travellers.length})</span>
        </div>
        <button onClick={openGroupPicker} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm">
          <FolderOpen className="w-4 h-4" /> Add Group
        </button>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : travellers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No directory travellers added</p>
          <p className="text-sm mt-1">Click "Add Group" to assign an entire group to this trip</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Added Via</th>
                <th className="px-4 py-3 font-medium">Groups</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {travellers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.traveller?.first_name} {t.traveller?.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.traveller?.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.traveller?.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{t.added_via || 'manual'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.traveller?.groups && t.traveller.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.traveller.groups.map(g => (
                          <span key={g} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">{g}</span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemove(t.master_id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Group Picker Modal */}
      {showGroups && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select Group to Add</h2>
              <button onClick={() => setShowGroups(false)}><X className="w-5 h-5" /></button>
            </div>
            {groups.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No groups available. Create groups in the Groups page first.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto">
                {groups.map(g => (
                  <button
                    key={g.group_id}
                    onClick={() => handleAddGroup(g.group_id)}
                    disabled={adding}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-purple-50 hover:border-purple-300 transition"
                  >
                    <div className="text-left">
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.member_count} members</p>
                    </div>
                    <Plus className="w-5 h-5 text-purple-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
