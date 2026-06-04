import { useEffect, useState } from 'react';
import { travellerProfile, updateTravellerProfile, TravellerUser } from '../../services/traveller';
import { User, Save, CheckCircle } from 'lucide-react';

export default function TravellerProfile() {
  const [profile, setProfile] = useState<TravellerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_relationship: '',
    medical_conditions: '',
    allergies: '',
    special_requirements: '',
    dietary_preferences: '',
  });

  useEffect(() => {
    travellerProfile().then((p) => {
      setProfile(p);
      setForm({
        emergency_contact_name: p.emergency_contact_name || '',
        emergency_contact_phone: p.emergency_contact_phone || '',
        emergency_relationship: p.emergency_relationship || '',
        medical_conditions: p.medical_conditions || '',
        allergies: p.allergies || '',
        special_requirements: p.special_requirements || '',
        dietary_preferences: p.dietary_preferences || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateTravellerProfile(form);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;
  if (!profile) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User size={20} className="text-indigo-600" /> Profile</h2>

      {/* Read-only info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Info</h3>
        <div className="grid grid-cols-1 gap-3">
          <Row label="Name" value={`${profile.first_name} ${profile.last_name}`} />
          <Row label="Phone" value={profile.phone} />
          <Row label="Email" value={profile.email} />
          <Row label="Gender" value={profile.gender} />
          <Row label="Date of Birth" value={profile.date_of_birth} />
          <Row label="Department" value={profile.department} />
          <Row label="City" value={profile.city} />
          <Row label="Nationality" value={profile.nationality} />
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency & Medical</h3>

        <Input label="Emergency Contact Name" value={form.emergency_contact_name} onChange={(v) => setForm({ ...form, emergency_contact_name: v })} />
        <Input label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={(v) => setForm({ ...form, emergency_contact_phone: v })} />
        <Input label="Relationship" value={form.emergency_relationship} onChange={(v) => setForm({ ...form, emergency_relationship: v })} />
        <Input label="Medical Conditions" value={form.medical_conditions} onChange={(v) => setForm({ ...form, medical_conditions: v })} multiline />
        <Input label="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} multiline />
        <Input label="Special Requirements" value={form.special_requirements} onChange={(v) => setForm({ ...form, special_requirements: v })} multiline />
        <Input label="Dietary Preferences" value={form.dietary_preferences} onChange={(v) => setForm({ ...form, dietary_preferences: v })} />

        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

function Input({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
