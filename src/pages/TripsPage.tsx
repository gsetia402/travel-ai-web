import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getTripSummary, createTrip, updateTrip, deleteTrip } from '../services/tripops';
import { MapPin, Users, DollarSign, Percent, Plus, Pencil, Trash2, X } from 'lucide-react';

interface TripCard {
  trip_id: string;
  trip_name: string;
  organization_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  traveller_count: number;
  budget: number;
  registrationPct: number;
  readinessPct: number;
}

const emptyForm = {
  trip_name: '',
  organization_name: '',
  destination: '',
  start_date: '',
  end_date: '',
  days: 1,
  traveller_count: 1,
  budget: 0,
};

export default function TripsPage() {
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTrips();
      const enriched: TripCard[] = [];
      for (const t of data) {
        let regPct = 0, readyPct = 0;
        try {
          const { data: s } = await getTripSummary(t.trip_id);
          regPct = s.traveller_count > 0 ? Math.round((s.registered_travellers / s.traveller_count) * 100) : 0;
          readyPct = s.trip_ready_percentage || 0;
        } catch {}
        enriched.push({ ...t, registrationPct: regPct, readinessPct: readyPct });
      }
      setTrips(enriched);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(trip: TripCard) {
    setEditId(trip.trip_id);
    setForm({
      trip_name: trip.trip_name,
      organization_name: trip.organization_name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      days: trip.days,
      traveller_count: trip.traveller_count,
      budget: trip.budget,
    });
    setShowModal(true);
  }

  async function handleDelete(tripId: string) {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await deleteTrip(tripId);
      await load();
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateTrip(editId, {
          trip_name: form.trip_name,
          destination: form.destination,
          start_date: form.start_date,
          end_date: form.end_date,
          days: Number(form.days),
          traveller_count: Number(form.traveller_count),
          budget: Number(form.budget),
        });
      } else {
        await createTrip({
          ...form,
          days: Number(form.days),
          traveller_count: Number(form.traveller_count),
          budget: Number(form.budget),
        });
      }
      setShowModal(false);
      await load();
    } catch {}
    setSaving(false);
  }

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  if (loading) return <div className="text-gray-500">Loading trips...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Create Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No trips yet. Create your first trip to get started.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Create Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div key={trip.trip_id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <Link to={`/trips/${trip.trip_id}`} className="flex-1">
                  <h3 className="font-semibold text-gray-900">{trip.trip_name}</h3>
                </Link>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(trip)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(trip.trip_id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <Link to={`/trips/${trip.trip_id}`}>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <MapPin size={14} /> {trip.destination}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600"><Users size={14} /> {trip.traveller_count}</div>
                  <div className="flex items-center gap-1.5 text-gray-600"><DollarSign size={14} /> ₹{(trip.budget / 1000).toFixed(0)}K</div>
                  <div className="flex items-center gap-1.5 text-gray-600"><Percent size={14} /> Reg: {trip.registrationPct}%</div>
                  <div className="flex items-center gap-1.5 text-gray-600"><Percent size={14} /> Ready: {trip.readinessPct}%</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Trip' : 'Create Trip'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Trip Name" value={form.trip_name} onChange={(v) => update('trip_name', v)} required />
              {!editId && <Field label="Organization Name" value={form.organization_name} onChange={(v) => update('organization_name', v)} required />}
              <Field label="Destination" value={form.destination} onChange={(v) => update('destination', v)} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" value={form.start_date} onChange={(v) => update('start_date', v)} type="date" required />
                <Field label="End Date" value={form.end_date} onChange={(v) => update('end_date', v)} type="date" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Days" value={String(form.days)} onChange={(v) => update('days', v)} type="number" required />
                <Field label="Travellers" value={String(form.traveller_count)} onChange={(v) => update('traveller_count', v)} type="number" required />
                <Field label="Budget (₹)" value={String(form.budget)} onChange={(v) => update('budget', v)} type="number" required />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm mt-2"
              >
                {saving ? 'Saving...' : editId ? 'Update Trip' : 'Create Trip'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
