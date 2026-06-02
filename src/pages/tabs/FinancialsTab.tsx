import { useEffect, useState } from 'react';
import { getFinancialSummary, getExpenseBreakdown } from '../../services/tripops';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function FinancialsTab({ tripId }: { tripId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, b] = await Promise.all([getFinancialSummary(tripId), getExpenseBreakdown(tripId)]);
        setSummary(s.data);
        setBreakdown(b.data?.categories || b.data || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <div className="text-gray-500">Loading financials...</div>;

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card icon={DollarSign} label="Total Budget" value={`₹${(summary.total_budget / 1000).toFixed(0)}K`} color="text-blue-600 bg-blue-50" />
          <Card icon={TrendingUp} label="Spent" value={`₹${((summary.amount_spent || summary.total_spent || 0) / 1000).toFixed(0)}K`} color="text-red-600 bg-red-50" />
          <Card icon={TrendingDown} label="Remaining" value={`₹${((summary.remaining_budget || summary.remaining || 0) / 1000).toFixed(0)}K`} color="text-green-600 bg-green-50" />
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {breakdown.map((item: any, idx: number) => {
              const total = summary?.total_budget || 1;
              const pct = Math.round(((item.amount || item.total || 0) / total) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.category || item.name}</span>
                    <span className="font-medium text-gray-900">₹{((item.amount || item.total || 0) / 1000).toFixed(1)}K ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {breakdown.length === 0 && <p className="text-gray-500">No expenses recorded yet.</p>}
    </div>
  );
}

function Card({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
