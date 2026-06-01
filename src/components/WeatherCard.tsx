import { Cloud, Thermometer } from 'lucide-react';
import type { WeatherResponse } from '../types';

interface WeatherCardProps {
  weather: WeatherResponse;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-6 h-6 text-sky-600" />
        <h3 className="text-lg font-semibold text-gray-900">Weather</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Temperature</p>
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{weather.temperature}°C</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Condition</p>
          <span className="text-lg font-semibold text-gray-900">{weather.condition}</span>
        </div>
      </div>
      {weather.recommendation && (
        <p className="mt-4 text-sm text-sky-700 bg-sky-100 rounded-lg px-3 py-2">
          {weather.recommendation}
        </p>
      )}
    </div>
  );
}
