import { useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import apiClient from '../api/client';
import type { RecommendationRequest, DestinationRecommendation } from '../types';
import Spinner from './Spinner';

interface RecommendationsProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Recommendations({ onNotify }: RecommendationsProps) {
  const [form, setForm] = useState<RecommendationRequest>({
    user_id: '',
    month: 'July',
    days: 7,
  });
  const [results, setResults] = useState<DestinationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'days' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id.trim()) {
      onNotify('error', 'Please enter a User ID');
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const { data } = await apiClient.post('/recommend', form);
      setResults(data.recommendations || []);
    } catch {
      onNotify('error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">Destination Recommendations</h2>
      <p className="section-subtitle">Get AI-powered destination suggestions based on your preferences</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              placeholder="e.g. gaurav"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select name="month" value={form.month} onChange={handleChange} className="input-field">
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
            <input
              type="number"
              name="days"
              value={form.days}
              onChange={handleChange}
              min={1}
              max={30}
              className="input-field"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner text="Finding destinations..." /> : <><Compass className="w-4 h-4" /> Get Recommendations</>}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((rec, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">{rec.destination}</h3>
              </div>
              <p className="text-sm text-gray-600">{rec.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
