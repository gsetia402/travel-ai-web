import { Plane } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Plane className="w-10 h-10" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Travel AI Platform
          </h1>
        </div>
        <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto">
          AI-Powered Personalized Travel Planning
        </p>
      </div>
    </header>
  );
}
