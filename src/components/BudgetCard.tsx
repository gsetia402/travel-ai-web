import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import type { BudgetEstimation } from '../types';

interface BudgetCardProps {
  budget: BudgetEstimation;
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  const isWithin = budget.budget_status === 'WITHIN_BUDGET';
  const breakdown = budget.cost_breakdown;

  const items = [
    { label: 'Stay', value: breakdown.stay },
    { label: 'Food', value: breakdown.food },
    { label: 'Local Transport', value: breakdown.local_transport },
    { label: 'Activities', value: breakdown.activities },
    { label: 'Miscellaneous', value: breakdown.miscellaneous },
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Budget Estimation</h3>
        </div>
        <span
          className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
            isWithin
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isWithin ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {isWithin ? 'Within Budget' : 'Over Budget'}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium text-gray-900">
              {budget.currency === 'INR' ? '₹' : budget.currency} {item.value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">
            ₹{breakdown.total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
