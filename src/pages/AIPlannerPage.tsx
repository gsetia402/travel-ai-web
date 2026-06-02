import { useState, useCallback } from 'react';
import UserPreferences from '../components/UserPreferences';
import Recommendations from '../components/Recommendations';
import TripPlanner from '../components/TripPlanner';
import Notification from '../components/Notification';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export default function AIPlannerPage() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const handleNotify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Trip Planner</h1>

      <div className="space-y-8">
        <UserPreferences onNotify={handleNotify} />
        <Recommendations onNotify={handleNotify} />
        <TripPlanner onNotify={handleNotify} />
      </div>
    </div>
  );
}
