import { useState } from 'react';
import { Save } from 'lucide-react';
import apiClient from '../api/client';
import type { UserPreferenceRequest } from '../types';
import Spinner from './Spinner';

interface UserPreferencesProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const TRIP_TYPES = ['mountains', 'beach', 'heritage', 'adventure', 'wildlife', 'spiritual'];
const ACCOMMODATIONS = ['hotel', 'homestay', 'hostel', 'resort', 'camping'];
const FOOD_PREFS = ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'no preference'];

export default function UserPreferences({ onNotify }: UserPreferencesProps) {
  const [form, setForm] = useState<UserPreferenceRequest>({
    user_id: '',
    budget: 30000,
    trip_type: 'mountains',
    accommodation: 'homestay',
    food_preference: 'vegetarian',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id.trim()) {
      onNotify('error', 'Please enter a User ID');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/memory/save', form);
      onNotify('success', 'Preferences saved successfully!');
    } catch {
      onNotify('error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">User Preferences</h2>
      <p className="section-subtitle">Save your travel preferences for personalized recommendations</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (INR)</label>
            <input
              type="number"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              min={1000}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
            <select name="trip_type" value={form.trip_type} onChange={handleChange} className="input-field">
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
            <select name="accommodation" value={form.accommodation} onChange={handleChange} className="input-field">
              {ACCOMMODATIONS.map((a) => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Preference</label>
            <select name="food_preference" value={form.food_preference} onChange={handleChange} className="input-field">
              {FOOD_PREFS.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner text="Saving..." /> : <><Save className="w-4 h-4" /> Save Preferences</>}
        </button>
      </form>
    </section>
  );
}
