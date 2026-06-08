import { useEffect, useState, useRef } from 'react';
import { getTravellersEnriched, createTraveller, updateTraveller, deleteTraveller, deleteTravellersBulk, uploadTravellersCsv } from '../../services/tripops';
import { listGroups, addGroupToTrip, syncDirectoryToTrip, listMasterTravellers, addTravellerToTrip } from '../../services/directory';
import { CheckCircle, XCircle, Plus, Upload, Download, X, Eye, Pencil, Trash2, FolderOpen, Search, BookUser, UserPlus } from 'lucide-react';

interface Traveller {
  traveller_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender?: string | null;
  date_of_birth?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_conditions?: string | null;
  dietary_preferences?: string | null;
  participation_status: string | null;
  membership_status: string | null;
  opt_out_reason?: string | null;
  membership_updated_at?: string | null;
  ready?: boolean;
  readiness?: { profile_completed: boolean; consents_completed: boolean; documents_completed: boolean; trip_ready: boolean; missing_items?: string[]; completed_count?: number; total_requirements?: number };
}

const emptyForm = { first_name: '', last_name: '', phone: '', email: '', gender: '', date_of_birth: '', emergency_contact_name: '', emergency_contact_phone: '', medical_conditions: '', dietary_preferences: '', membership_status: 'ACTIVE' };

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  OPTED_OUT: 'bg-amber-50 text-amber-700',
  REMOVED_BY_ORGANIZER: 'bg-red-50 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  OPTED_OUT: 'Opted Out',
  REMOVED_BY_ORGANIZER: 'Removed',
};

export default function TravellersTab({ tripId }: { tripId: string }) {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'opted_out' | 'removed'>('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewTraveller, setViewTraveller] = useState<Traveller | null>(null);
  const [editTraveller, setEditTraveller] = useState<Traveller | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<{group_id:string;name:string;member_count:number}[]>([]);
  const [addingGroup, setAddingGroup] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTravellersEnriched(tripId);
      const mapped = data.map((t: any) => ({
        ...t,
        ready: t.readiness?.trip_ready ?? false,
      }));
      setTravellers(mapped);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createTraveller(tripId, { first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, gender: form.gender || undefined, date_of_birth: form.date_of_birth || undefined });
      setForm(emptyForm);
      setShowAdd(false);
      await load();
    } catch {}
    setSaving(false);
  }

  function openEdit(t: Traveller) {
    setEditTraveller(t);
    setEditForm({
      first_name: t.first_name, last_name: t.last_name, phone: t.phone, email: t.email,
      gender: t.gender || '', date_of_birth: t.date_of_birth || '',
      emergency_contact_name: t.emergency_contact_name || '', emergency_contact_phone: t.emergency_contact_phone || '',
      medical_conditions: t.medical_conditions || '', dietary_preferences: t.dietary_preferences || '',
      membership_status: (t as any).membership_status || 'ACTIVE',
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTraveller) return;
    setSaving(true);
    try {
      const payload: any = {};
      Object.entries(editForm).forEach(([k, v]) => { if (v !== '') payload[k] = v; });
      await updateTraveller(editTraveller.traveller_id, payload);
      setEditTraveller(null);
      await load();
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteTraveller(id);
      setDeleteConfirm(null);
      await load();
    } catch {}
  }

  async function openGroupPicker() {
    try { const r = await listGroups(); setAvailableGroups(r.data); } catch { setAvailableGroups([]); }
    setShowGroupPicker(true);
  }

  async function handleAddGroup(groupId: string) {
    setAddingGroup(true);
    try {
      const res = await addGroupToTrip(tripId, groupId);
      // Also sync any previously-added directory travellers that may be missing legacy records
      await syncDirectoryToTrip(tripId);
      const d = res.data;
      alert(`${d.added} travellers added, ${d.skipped} already present (${d.total} total in group)`);
      load();
    } catch { alert('Failed to add group'); }
    setAddingGroup(false);
    setShowGroupPicker(false);
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await uploadTravellersCsv(tripId, file); await load(); } catch {}
    if (fileRef.current) fileRef.current.value = '';
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.traveller_id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await deleteTravellersBulk(tripId, Array.from(selected));
      setSelected(new Set());
      setShowBulkConfirm(false);
      await load();
    } catch {}
    setBulkDeleting(false);
  }

  function handleExport() {
    const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Membership Status', 'Registration'];
    const rows = travellers.map((t) => [t.first_name, t.last_name, t.phone, t.email || '', t.gender || '', t.membership_status || 'ACTIVE', t.ready ? 'Complete' : 'Incomplete']);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `travellers-${tripId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = travellers.filter((t) => {
    if (filter === 'active') return (t.membership_status || 'ACTIVE') === 'ACTIVE';
    if (filter === 'opted_out') return t.membership_status === 'OPTED_OUT';
    if (filter === 'removed') return t.membership_status === 'REMOVED_BY_ORGANIZER';
    return true;
  });

  const activeCount = travellers.filter(t => (t.membership_status || 'ACTIVE') === 'ACTIVE').length;
  const optedOutCount = travellers.filter(t => t.membership_status === 'OPTED_OUT').length;
  const removedCount = travellers.filter(t => t.membership_status === 'REMOVED_BY_ORGANIZER').length;

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-500">Loading travellers...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'active', 'opted_out', 'removed'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setSelected(new Set()); }} className={`px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? `All (${travellers.length})` : f === 'active' ? `Active (${activeCount})` : f === 'opted_out' ? `Opted Out (${optedOutCount})` : `Removed (${removedCount})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {selected.size > 0 && (
            <button onClick={() => setShowBulkConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"><Trash2 size={13} /> Remove {selected.size}</button>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"><Plus size={13} /> Add</button>
          <button onClick={openGroupPicker} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"><FolderOpen size={13} /> Add Group</button>
          <label className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 cursor-pointer"><Upload size={13} /> CSV<input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} /></label>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"><Download size={13} /> Export</button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3"><h4 className="font-medium text-gray-900 text-sm">Add Traveller</h4><button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button></div>
          <DirectoryPicker tripId={tripId} existingPhones={travellers.map(t => t.phone)} onAdded={() => { setShowAdd(false); load(); }} />
          <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 uppercase">or add manually</span></div></div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Last Name *" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Phone *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option></select>
            <input type="date" placeholder="Date of Birth" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <div className="sm:col-span-2"><button type="submit" disabled={saving} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add Traveller'}</button></div>
          </form>
        </div>
      )}

      {/* Mobile: Card layout */}
      <div className="sm:hidden space-y-3">
        {filtered.map((t) => (
          <div key={t.traveller_id} className={`bg-white rounded-xl border p-4 ${selected.has(t.traveller_id) ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selected.has(t.traveller_id)} onChange={() => toggleSelect(t.traveller_id)} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-gray-500">{t.gender || ''} · {t.phone}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  {t.ready ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.membership_status || 'ACTIVE'] || 'bg-gray-50 text-gray-700'}`}>
                    {STATUS_LABEL[t.membership_status || 'ACTIVE'] || t.membership_status}
                  </span>
                </div>
                {!t.ready && t.readiness?.missing_items && t.readiness.missing_items.length > 0 && (
                  <span className="text-[10px] text-gray-400">{t.readiness.completed_count}/{t.readiness.total_requirements} · {t.readiness.missing_items.length} missing</span>
                )}
                {(t.membership_status === 'OPTED_OUT' || t.membership_status === 'REMOVED_BY_ORGANIZER') && t.membership_updated_at && (
                  <span className="text-[10px] text-gray-400">{new Date(t.membership_updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
              <button onClick={() => setViewTraveller(t)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye size={13} /> View</button>
              <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"><Pencil size={13} /> Edit</button>
              <button onClick={() => setDeleteConfirm(t.traveller_id)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400">No travellers match filter.</p>
          </div>
        )}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-blue-600" /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Registration</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.traveller_id} className={`hover:bg-gray-50 group ${selected.has(t.traveller_id) ? 'bg-blue-50/40' : ''}`}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(t.traveller_id)} onChange={() => toggleSelect(t.traveller_id)} className="h-4 w-4 rounded border-gray-300 text-blue-600" /></td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                  {t.gender && <p className="text-xs text-gray-400">{t.gender}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-600">{t.phone}</p>
                  <p className="text-xs text-gray-400">{t.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[t.membership_status || 'ACTIVE'] || 'bg-gray-50 text-gray-700'}`}>
                    {STATUS_LABEL[t.membership_status || 'ACTIVE'] || t.membership_status}
                  </span>
                  {t.membership_status === 'OPTED_OUT' && t.opt_out_reason && (
                    <p className="text-xs text-amber-600 mt-0.5 truncate max-w-[160px]" title={t.opt_out_reason}>{t.opt_out_reason}</p>
                  )}
                  {(t.membership_status === 'OPTED_OUT' || t.membership_status === 'REMOVED_BY_ORGANIZER') && t.membership_updated_at && (
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(t.membership_updated_at).toLocaleDateString()}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.ready ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={14} /> Complete</span>
                  ) : (
                    <div>
                      <button onClick={() => setViewTraveller(t)} className="inline-flex items-center gap-1 text-red-500 hover:underline text-xs font-medium">
                        <XCircle size={14} /> {t.readiness?.completed_count ?? 0}/{t.readiness?.total_requirements ?? 0}
                      </button>
                      {t.readiness?.missing_items && t.readiness.missing_items.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]" title={t.readiness.missing_items.join(', ')}>
                          Missing: {t.readiness.missing_items.slice(0, 2).join(', ')}{t.readiness.missing_items.length > 2 ? ` +${t.readiness.missing_items.length - 2}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewTraveller(t)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="View"><Eye size={14} /></button>
                    <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm(t.traveller_id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400">No travellers match filter.</p>
          </div>
        )}
      </div>

      {/* View Modal with Readiness Breakdown */}
      {viewTraveller && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:px-4" onClick={() => setViewTraveller(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{viewTraveller.first_name} {viewTraveller.last_name}</h2>
              <button onClick={() => setViewTraveller(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Phone" value={viewTraveller.phone} />
              <Row label="Email" value={viewTraveller.email} />
              <Row label="Gender" value={viewTraveller.gender} />
              <Row label="Date of Birth" value={viewTraveller.date_of_birth} />
              <Row label="Emergency Contact" value={viewTraveller.emergency_contact_name ? `${viewTraveller.emergency_contact_name} (${viewTraveller.emergency_contact_phone || ''})` : undefined} />
              <Row label="Medical Conditions" value={viewTraveller.medical_conditions} />
              <Row label="Dietary Preferences" value={viewTraveller.dietary_preferences} />
              <Row label="Membership Status" value={STATUS_LABEL[viewTraveller.membership_status || 'ACTIVE'] || viewTraveller.membership_status} />
              {viewTraveller.membership_status === 'OPTED_OUT' && viewTraveller.opt_out_reason && (
                <Row label="Opt-out Reason" value={viewTraveller.opt_out_reason} />
              )}
              {viewTraveller.readiness && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 mb-2">Registration Checklist <span className="text-xs font-normal text-gray-400">({viewTraveller.readiness.completed_count ?? 0}/{viewTraveller.readiness.total_requirements ?? 0})</span></p>
                  <div className="space-y-1.5">
                    <ReadinessItem ok={viewTraveller.readiness.profile_completed} label="Profile Information" />
                    <ReadinessItem ok={!!viewTraveller.emergency_contact_name} label="Emergency Contact" />
                    <ReadinessItem ok={viewTraveller.readiness.documents_completed} label="Required Documents" />
                    <ReadinessItem ok={viewTraveller.readiness.consents_completed} label="Consents" />
                  </div>
                  {viewTraveller.readiness.missing_items && viewTraveller.readiness.missing_items.length > 0 && (
                    <div className="mt-3 bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Missing Items</p>
                      <ul className="text-xs text-red-600 space-y-0.5">
                        {viewTraveller.readiness.missing_items.map((item, i) => (
                          <li key={i} className="flex items-center gap-1"><XCircle size={11} className="flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { openEdit(viewTraveller); setViewTraveller(null); }} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Edit</button>
              <button onClick={() => setViewTraveller(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTraveller && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:px-4" onClick={() => setEditTraveller(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Traveller</h2>
              <button onClick={() => setEditTraveller(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="First Name" value={editForm.first_name} onChange={(v) => setEditForm({ ...editForm, first_name: v })} required />
                <FormField label="Last Name" value={editForm.last_name} onChange={(v) => setEditForm({ ...editForm, last_name: v })} required />
                <FormField label="Phone" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} required />
                <FormField label="Email" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" required />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                  <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select>
                </div>
                <FormField label="Date of Birth" value={editForm.date_of_birth} onChange={(v) => setEditForm({ ...editForm, date_of_birth: v })} type="date" />
                <FormField label="Emergency Contact" value={editForm.emergency_contact_name} onChange={(v) => setEditForm({ ...editForm, emergency_contact_name: v })} />
                <FormField label="Emergency Phone" value={editForm.emergency_contact_phone} onChange={(v) => setEditForm({ ...editForm, emergency_contact_phone: v })} />
              </div>
              <FormField label="Medical Conditions" value={editForm.medical_conditions} onChange={(v) => setEditForm({ ...editForm, medical_conditions: v })} />
              <FormField label="Dietary Preferences" value={editForm.dietary_preferences} onChange={(v) => setEditForm({ ...editForm, dietary_preferences: v })} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Membership Status</label>
                <select value={editForm.membership_status} onChange={(e) => setEditForm({ ...editForm, membership_status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="ACTIVE">Active</option><option value="OPTED_OUT">Opted Out</option><option value="REMOVED_BY_ORGANIZER">Removed By Organizer</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditTraveller(null)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowBulkConfirm(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove {selected.size} Traveller{selected.size > 1 ? 's' : ''}?</h2>
            <p className="text-sm text-gray-500 mb-4">This will set the selected travellers' status to "Removed By Organizer". Their history and data will be preserved.</p>
            <div className="flex gap-2">
              <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? 'Removing...' : `Remove ${selected.size}`}</button>
              <button onClick={() => setShowBulkConfirm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Picker Modal */}
      {showGroupPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowGroupPicker(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Group to Trip</h2>
              <button onClick={() => setShowGroupPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {availableGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No groups available. Create groups in the Groups page first.</p>
            ) : (
              <div className="space-y-2">
                {availableGroups.map(g => (
                  <button key={g.group_id} onClick={() => handleAddGroup(g.group_id)} disabled={addingGroup}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-purple-50 hover:border-purple-300 transition disabled:opacity-50">
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.member_count} members</p>
                    </div>
                    <Plus size={18} className="text-purple-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove Traveller</h2>
            <p className="text-sm text-gray-500 mb-4">Are you sure? The traveller's status will be set to "Removed By Organizer". Their history and data will be preserved.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Remove</button>
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectoryPicker({ tripId, existingPhones, onAdded }: { tripId: string; existingPhones: string[]; onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setResults([]); setHasSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await listMasterTravellers(value.trim());
        setResults(data);
      } catch { setResults([]); }
      setSearching(false);
      setHasSearched(true);
    }, 300);
  }

  async function handleAdd(masterId: string) {
    setAdding(masterId);
    try {
      await addTravellerToTrip(tripId, masterId);
      await syncDirectoryToTrip(tripId);
      onAdded();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to add traveller');
    }
    setAdding(null);
  }

  const alreadyAdded = new Set(existingPhones);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookUser size={14} className="text-purple-600" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pick from Directory</span>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
        />
        {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</span>}
      </div>
      {hasSearched && results.length === 0 && !searching && (
        <p className="text-xs text-gray-400 mt-2 text-center">No travellers found matching "{query}"</p>
      )}
      {results.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
          {results.map((t) => {
            const isAdded = alreadyAdded.has(t.phone);
            return (
              <div key={t.master_id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-gray-500">{t.phone}{t.email ? ` · ${t.email}` : ''}{t.city ? ` · ${t.city}` : ''}</p>
                </div>
                {isAdded ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full flex-shrink-0">
                    <CheckCircle size={11} /> Added
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(t.master_id)}
                    disabled={adding === t.master_id}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex-shrink-0"
                  >
                    {adding === t.master_id ? 'Adding...' : <><UserPlus size={12} /> Add</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}

function ReadinessItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}
      <span className={ok ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
  );
}
