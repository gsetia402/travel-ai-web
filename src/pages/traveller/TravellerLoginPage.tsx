import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travellerLogin } from '../../services/traveller';
import { Plane } from 'lucide-react';

export default function TravellerLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!phone || !dob) { setError('Both fields are required'); return; }
    setLoading(true);
    try {
      await travellerLogin(phone, dob);
      navigate('/traveller/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Check your phone and date of birth.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plane size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Traveller Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Access your trip information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your registered phone"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">
            Use the phone number and date of birth registered by your coordinator.
          </p>
        </form>

        <p className="text-center mt-6 text-xs text-gray-400">
          Are you a coordinator? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}
