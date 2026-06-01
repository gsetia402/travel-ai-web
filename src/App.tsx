import { useState, useCallback } from 'react';
import Header from './components/Header';
import UserPreferences from './components/UserPreferences';
import Recommendations from './components/Recommendations';
import TripPlanner from './components/TripPlanner';
import Notification from './components/Notification';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const handleNotify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      )}

      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <UserPreferences onNotify={handleNotify} />
        <Recommendations onNotify={handleNotify} />
        <TripPlanner onNotify={handleNotify} />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>Travel AI Platform &middot; Powered by Gemini AI &middot; v1.1.0</p>
        </div>
      </footer>
    </div>
  );
}
