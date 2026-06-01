import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  text?: string;
}

export default function Spinner({ text = 'Loading...' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      <span className="text-gray-500 font-medium">{text}</span>
    </div>
  );
}
