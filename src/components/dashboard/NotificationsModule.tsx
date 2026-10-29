import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { NotificationItem } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';

export const NotificationsModule: React.FC = () => {
  const { addToast } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        addToast('success', 'Updated', 'Notification marked as read.');
      }
    } catch (e) {
      addToast('error', 'Error', 'Failed to update notification status.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-600" />
            Official HRMS System Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates for service book modifications, leave sanctions, and establishment notices.
          </p>
        </div>

        <span className="px-3 py-1 bg-sky-100 text-sky-800 font-bold text-xs rounded-full">
          {notifications.filter((n) => !n.isRead).length} Unread
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden divide-y divide-slate-200">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 transition-colors flex items-start gap-3 ${
              notif.isRead
                ? 'bg-white'
                : 'bg-sky-50/50'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                notif.isRead
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-sky-600 text-white shadow-xs'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800">
                  {notif.title}
                </h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {notif.message}
              </p>
            </div>

            {!notif.isRead && (
              <button
                onClick={() => handleMarkAsRead(notif.id)}
                className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                title="Mark as Read"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Read
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No system notifications present at this time.
          </div>
        )}
      </div>
    </div>
  );
};
