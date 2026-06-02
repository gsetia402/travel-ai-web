import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Map, CheckCircle, Upload, FileText, X, Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_TRIPOPS_API_URL || 'https://travel-ai-platform-urhu.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export default function PublicRegisterPage() {
  const { code } = useParams<{ code: string }>();
  const [tripInfo, setTripInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: '',
    city: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: '',
    allergies: '',
    dietary_preferences: '',
  });
  const [documents, setDocuments] = useState<{ type: string; file: File }[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('GOVERNMENT_ID');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/register/${code}`);
        setTripInfo(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Registration link is invalid or inactive.');
      }
    }
    if (code) load();
  }, [code]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = { ...form };
      Object.keys(payload).forEach((k) => { if (!payload[k]) delete payload[k]; });
      const { data: traveller } = await api.post(`/register/${code}`, payload);

      // Upload documents if any
      for (const doc of documents) {
        const formData = new FormData();
        formData.append('document_type', doc.type);
        formData.append('file', doc.file);
        try {
          await api.post(`/register/${code}/documents/${traveller.traveller_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {}
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
    setSaving(false);
  }

  function addDocument(file: File) {
    setDocuments((prev) => [...prev, { type: docType, file }]);
  }

  function removeDocument(idx: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  }

  if (error && !tripInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Link Unavailable</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-sm text-gray-500">You have been registered for the trip. The coordinator will reach out with further details.</p>
        </div>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-1">
            <Map size={24} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Trip Registration</h1>
          </div>
          <p className="text-sm text-gray-500">{tripInfo.trip_name} — {tripInfo.origin_city ? `${tripInfo.origin_city} → ${tripInfo.destination}` : tripInfo.destination}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                <input type="text" value={form.emergency_contact_name} onChange={(e) => update('emergency_contact_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                <input type="tel" value={form.emergency_contact_phone} onChange={(e) => update('emergency_contact_phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Health & Preferences</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Medical Conditions</label>
                <input type="text" value={form.medical_conditions} onChange={(e) => update('medical_conditions', e.target.value)} placeholder="e.g. Asthma, Diabetes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Allergies</label>
                <input type="text" value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="e.g. Peanuts, Dust" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dietary Preferences</label>
                <input type="text" value={form.dietary_preferences} onChange={(e) => update('dietary_preferences', e.target.value)} placeholder="e.g. Vegetarian, Vegan" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Documents (Optional)</p>
            <p className="text-xs text-gray-400 mb-3">Upload ID proof, passport, visa, or other documents. Supported formats: PDF, JPG, PNG.</p>
            <div className="flex gap-2 items-end mb-3">
              <div className="flex-1">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="GOVERNMENT_ID">Government ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VISA">Visa</option>
                  <option value="STUDENT_ID">Student ID</option>
                  <option value="CONSENT_FORM">Consent Form</option>
                </select>
              </div>
              <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) addDocument(f); e.target.value = ''; }} className="hidden" />
              <button type="button" onClick={() => docInputRef.current?.click()} className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1.5 border border-gray-200">
                <Upload size={14} /> Add File
              </button>
            </div>
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{doc.file.name}</p>
                        <p className="text-xs text-gray-400">{doc.type.replace(/_/g, ' ')} · {(doc.file.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeDocument(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm mt-4"
          >
            {saving ? 'Registering...' : 'Register for Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
