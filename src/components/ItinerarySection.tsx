import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { ItineraryResponse } from '../types';

interface ItinerarySectionProps {
  itinerary: ItineraryResponse;
}

export default function ItinerarySection({ itinerary }: ItinerarySectionProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggle = (day: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(itinerary.itinerary.map((d) => String(d.day))));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Itinerary</h3>
          <span className="text-sm text-gray-500">({itinerary.days} days)</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {itinerary.itinerary.map((dayPlan) => {
        const dayKey = String(dayPlan.day);
        const isExpanded = expandedDays.has(dayKey);

        return (
          <div
            key={dayKey}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(dayKey)}
              className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-gray-900">Day {dayPlan.day}</span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isExpanded && dayPlan.activities && dayPlan.activities.length > 0 && (
              <div className="px-5 py-4 space-y-2 bg-white">
                {dayPlan.activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{activity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
