import { create } from "zustand";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  isRead: boolean;
  isPersistent?: boolean; // Won't auto-dismiss
  timestamp: Date;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "isRead" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      isRead: false,
      timestamp: new Date(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },
}));
