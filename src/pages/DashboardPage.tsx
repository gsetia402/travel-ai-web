import { useEffect, useState } from 'react';
import { getTrips, getTripSummary } from '../services/tripops';
import { Map, Users, ClipboardCheck, FileWarning, ShieldCheck, DollarSign, TrendingDown, Percent } from 'lucide-react';

interface Metrics {
  totalTrips: number;
  totalTravellers: number;
  registeredTravellers: number;
  pendingConsents: number;
  missingDocuments: number;
  tripReadyPct: number;
  totalBudget: number;
  remainingBudget: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: trips } = await getTrips();
        let totalTravellers = 0, registered = 0, pending = 0, missing = 0, ready = 0, budget = 0, remaining = 0;
        let tripCount = 0;

        for (const trip of trips) {
          try {
            const { data: s } = await getTripSummary(trip.trip_id);
            totalTravellers += s.traveller_count || 0;
            registered += s.registered_travellers || 0;
            pending += s.pending_consents || 0;
            budget += s.total_budget || 0;
            remaining += s.remaining_budget || 0;
            ready += s.trip_ready_percentage || 0;
            tripCount++;
          } catch {}
        }

        setMetrics({
          totalTrips: trips.length,
          totalTravellers,
          registeredTravellers: registered,
          pendingConsents: pending,
          missingDocuments: missing,
          tripReadyPct: tripCount > 0 ? Math.round(ready / tripCount) : 0,
          totalBudget: budget,
          remainingBudget: remaining,
        });
      } catch { }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!metrics) return <div className="text-red-500">Failed to load dashboard.</div>;

  const cards = [
    { label: 'Total Trips', value: metrics.totalTrips, icon: Map, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Travellers', value: metrics.totalTravellers, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Registered', value: metrics.registeredTravellers, icon: ClipboardCheck, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Consents', value: metrics.pendingConsents, icon: FileWarning, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Trip Ready %', value: `${metrics.tripReadyPct}%`, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Budget', value: `₹${(metrics.totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
    { label: 'Remaining', value: `₹${(metrics.remainingBudget / 1000).toFixed(0)}K`, icon: TrendingDown, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
