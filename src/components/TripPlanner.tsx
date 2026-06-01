import { useState } from 'react';
import { Map } from 'lucide-react';
import apiClient from '../api/client';
import type { TripPlanRequest, TripPlanResponse } from '../types';
import Spinner from './Spinner';
import WeatherCard from './WeatherCard';
import BudgetCard from './BudgetCard';
import ItinerarySection from './ItinerarySection';
import TravelAdvice from './TravelAdvice';

interface TripPlannerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function TripPlanner({ onNotify }: TripPlannerProps) {
  const [form, setForm] = useState<TripPlanRequest>({
    user_id: '',
    destination: '',
    days: 5,
  });
  const [result, setResult] = useState<TripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'days' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id.trim() || !form.destination.trim()) {
      onNotify('error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await apiClient.post('/plan-trip', form);
      setResult(data);
    } catch {
      onNotify('error', 'Failed to generate trip plan. The server may be starting up — please try again in a minute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">Trip Planner</h2>
      <p className="section-subtitle">Generate a complete AI-powered trip plan</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              type="text"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="e.g. Manali"
              className="input-field"
              required
            />
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
          {loading ? (
            <Spinner text="Generating trip plan..." />
          ) : (
            <>
              <Map className="w-4 h-4" /> Generate Trip Plan
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="mt-8">
          <Spinner text="This may take up to 2 minutes. Gemini is crafting your personalized trip..." />
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">
              Trip to {result.destination}
            </h3>
            {result.user_preferences && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                Personalized
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.weather ? (
              <WeatherCard weather={result.weather} />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center justify-center">
                <p className="text-sm text-gray-500">Weather data unavailable for this destination</p>
              </div>
            )}
            {result.budget_estimation && <BudgetCard budget={result.budget_estimation} />}
          </div>

          {result.itinerary && <ItinerarySection itinerary={result.itinerary} />}

          {result.travel_advice.length > 0 && (
            <TravelAdvice advice={result.travel_advice} />
          )}
        </div>
      )}
    </section>
  );
}
