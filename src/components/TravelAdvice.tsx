import { Lightbulb } from 'lucide-react';

interface TravelAdviceProps {
  advice: string[];
}

export default function TravelAdvice({ advice }: TravelAdviceProps) {
  if (!advice.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-gray-900">Travel Advice</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {advice.map((tip, i) => (
          <span
            key={i}
            className="bg-amber-50 text-amber-800 border border-amber-200 text-sm px-3 py-1.5 rounded-full"
          >
            {tip}
          </span>
        ))}
      </div>
    </div>
  );
}
