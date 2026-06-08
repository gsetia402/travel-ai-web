import { useEffect, useState } from 'react';
import { getTripsOverview, getPaymentDashboard } from '../services/tripops';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle, Clock, ArrowUpRight, PieChart, BarChart3 } from 'lucide-react';

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
function fmtK(n: number) { return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`; }

export default function FinancialsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getTripsOverview();
        const enriched = await Promise.all(
          data.map(async (trip: any) => {
            let payDash = null;
            try { const pd = await getPaymentDashboard(trip.trip_id); payDash = pd.data; } catch {}
            const fin = trip.summary ? {
              total_budget: trip.summary.total_budget || trip.budget,
              amount_spent: trip.summary.amount_spent || 0,
              remaining_budget: trip.summary.remaining_budget || trip.budget,
              amount_received: payDash?.amount_received || 0,
              outstanding: payDash?.outstanding_amount || 0,
            } : { total_budget: trip.budget, amount_spent: 0, remaining_budget: trip.budget, amount_received: 0, outstanding: 0 };
            return { ...trip, fin, payDash };
          })
        );
        setTrips(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Loading financials...</div>;

  // Aggregate totals
  const totals = trips.reduce((acc, t) => ({
    budget: acc.budget + t.fin.total_budget,
    spent: acc.spent + t.fin.amount_spent,
    received: acc.received + t.fin.amount_received,
    outstanding: acc.outstanding + t.fin.outstanding,
    remaining: acc.remaining + t.fin.remaining_budget,
  }), { budget: 0, spent: 0, received: 0, outstanding: 0, remaining: 0 });

  const activeTrips = trips.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status));
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const overBudgetTrips = trips.filter(t => t.fin.amount_spent > t.fin.total_budget);
  const collectionRate = totals.budget > 0 ? Math.round((totals.received / totals.budget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Consolidated view across {trips.length} trips</p>
      </div>

      {/* Top-level KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={Wallet} label="Total Budget" value={fmtK(totals.budget)} color="text-blue-600 bg-blue-50" />
        <KPICard icon={TrendingUp} label="Income Received" value={fmtK(totals.received)} color="text-emerald-600 bg-emerald-50" />
        <KPICard icon={TrendingDown} label="Total Spent" value={fmtK(totals.spent)} color="text-red-600 bg-red-50" />
        <KPICard icon={AlertCircle} label="Outstanding" value={fmtK(totals.outstanding)} color="text-amber-600 bg-amber-50" />
        <KPICard icon={DollarSign} label="Available Balance" value={fmtK(totals.remaining)} color="text-green-600 bg-green-50" />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="Active Trips" value={String(activeTrips.length)} sub={`${completedTrips.length} completed`} />
        <MiniCard label="Collection Rate" value={`${collectionRate}%`} sub={`${fmt(totals.received)} of ${fmt(totals.budget)}`} />
        <MiniCard label="Budget Utilization" value={`${totals.budget > 0 ? Math.round((totals.spent / totals.budget) * 100) : 0}%`} sub={`${fmt(totals.spent)} spent`} />
        <MiniCard label="Over-budget Trips" value={String(overBudgetTrips.length)} sub={overBudgetTrips.length > 0 ? 'Needs attention' : 'All within budget'} alert={overBudgetTrips.length > 0} />
      </div>

      {/* Budget vs Spend Progress */}
      {totals.budget > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 size={14} className="text-gray-400" /> Budget Utilization
            </h3>
            <span className="text-xs text-gray-500">{Math.round((totals.spent / totals.budget) * 100)}% utilized</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${Math.min((totals.spent / totals.budget) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Spent: {fmt(totals.spent)}</span>
            <span>Budget: {fmt(totals.budget)}</span>
          </div>
        </div>
      )}

      {/* Collection Progress */}
      {totals.budget > 0 && totals.received > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <PieChart size={14} className="text-gray-400" /> Payment Collection
            </h3>
            <span className="text-xs text-gray-500">{collectionRate}% collected</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Received: {fmt(totals.received)}</span>
            <span>Outstanding: {fmt(totals.outstanding)}</span>
          </div>
        </div>
      )}

      {/* Per-Trip Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Trip-wise Financials</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trip</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Budget</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Received</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Spent</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Outstanding</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map((trip) => {
                const utilPct = trip.fin.total_budget > 0 ? Math.round((trip.fin.amount_spent / trip.fin.total_budget) * 100) : 0;
                const isOver = utilPct > 100;
                return (
                  <tr key={trip.trip_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/trips/${trip.trip_id}`} className="flex items-center gap-2 group">
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">{trip.trip_name}</p>
                          <p className="text-xs text-gray-400">{trip.destination} · {trip.start_date}</p>
                        </div>
                        <ArrowUpRight size={12} className="text-gray-300 group-hover:text-blue-500" />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtK(trip.fin.total_budget)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{fmtK(trip.fin.amount_received)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmtK(trip.fin.amount_spent)}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{trip.fin.outstanding > 0 ? fmtK(trip.fin.outstanding) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <AlertCircle size={10} /> Over
                        </span>
                      ) : utilPct >= 80 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <Clock size={10} /> {utilPct}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle size={10} /> {utilPct}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {trips.length === 0 && <p className="text-center py-8 text-gray-400">No trips found.</p>}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function MiniCard({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${alert ? 'border-red-200' : 'border-gray-200'}`}>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
