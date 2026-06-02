import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrips, getTripSummary } from '../services/tripops';
import { Map, Users, ClipboardCheck, FileWarning, ShieldCheck, DollarSign, TrendingDown, AlertTriangle, BedDouble, ArrowRight } from 'lucide-react';

interface TripAction { tripId: string; tripName: string; type: string; count: number; }

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [actions, setActions] = useState<TripAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: tripList } = await getTrips();
        setTrips(tripList);
        let totalTravellers = 0, registered = 0, pending = 0, missing = 0, ready = 0, budget = 0, remaining = 0, unallocated = 0;
        let tripCount = 0;
        const actionItems: TripAction[] = [];

        for (const trip of tripList) {
          try {
            const { data: s } = await getTripSummary(trip.trip_id);
            totalTravellers += s.traveller_count || 0;
            registered += s.registered_travellers || 0;
            pending += s.pending_consents || 0;
            missing += s.missing_documents || 0;
            budget += s.total_budget || 0;
            remaining += s.remaining_budget || 0;
            unallocated += s.unallocated_travellers || 0;
            ready += s.trip_ready_percentage || 0;
            tripCount++;

            if ((s.unallocated_travellers || 0) > 0) actionItems.push({ tripId: trip.trip_id, tripName: trip.trip_name, type: 'unallocated', count: s.unallocated_travellers });
            if ((s.pending_consents || 0) > 0) actionItems.push({ tripId: trip.trip_id, tripName: trip.trip_name, type: 'consents', count: s.pending_consents });
            if ((s.missing_documents || 0) > 0) actionItems.push({ tripId: trip.trip_id, tripName: trip.trip_name, type: 'documents', count: s.missing_documents });
          } catch {}
        }

        setActions(actionItems);
        setMetrics({
          totalTrips: tripList.length,
          totalTravellers, registeredTravellers: registered,
          pendingConsents: pending, missingDocuments: missing, unallocatedTravellers: unallocated,
          tripReadyPct: tripCount > 0 ? Math.round(ready / tripCount) : 0,
          totalBudget: budget, remainingBudget: remaining,
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>;
  if (!metrics) return <div className="text-red-500">Failed to load dashboard.</div>;

  const cards = [
    { label: 'Total Trips', value: metrics.totalTrips, icon: Map, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Travellers', value: metrics.totalTravellers, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Registered', value: metrics.registeredTravellers, icon: ClipboardCheck, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Consents', value: metrics.pendingConsents, icon: FileWarning, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Missing Docs', value: metrics.missingDocuments, icon: FileWarning, color: 'bg-red-50 text-red-600' },
    { label: 'Unallocated', value: metrics.unallocatedTravellers, icon: BedDouble, color: 'bg-purple-50 text-purple-600' },
    { label: 'Avg Readiness', value: `${metrics.tripReadyPct}%`, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Budget Remaining', value: `₹${(metrics.remainingBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
  ];

  const statusCounts: Record<string, number> = {};
  trips.forEach((t: any) => { statusCounts[t.status || 'DRAFT'] = (statusCounts[t.status || 'DRAFT'] || 0) + 1; });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Center */}
      {actions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Action Center</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.slice(0, 6).map((a, i) => (
              <button key={i} onClick={() => navigate(`/trips/${a.tripId}`)} className="bg-white rounded-lg border border-amber-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow text-left w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.type === 'unallocated' ? `${a.count} unallocated` : a.type === 'consents' ? `${a.count} pending consents` : `${a.count} missing docs`}
                    </p>
                    <p className="text-xs text-gray-400">{a.tripName}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trip Status Overview */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Trip Status Overview</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className={`w-2 h-2 rounded-full ${status === 'COMPLETED' ? 'bg-green-500' : status === 'CANCELLED' ? 'bg-red-500' : status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <span className="text-sm text-gray-700">{status.replace(/_/g, ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Trips</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {trips.slice(0, 5).map((t: any) => (
            <button key={t.trip_id} onClick={() => navigate(`/trips/${t.trip_id}`)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 text-left">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.trip_name}</p>
                <p className="text-xs text-gray-400">{t.origin_city ? `${t.origin_city} → ${t.destination}` : t.destination} · {t.start_date}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(t.status || 'DRAFT') === 'COMPLETED' ? 'bg-green-50 text-green-700' : (t.status || 'DRAFT') === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {(t.status || 'DRAFT').replace(/_/g, ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
