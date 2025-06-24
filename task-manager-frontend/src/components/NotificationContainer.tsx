"use client";

import { useNotificationStore } from "@/store/notificationStore";
import NotificationToast from "./NotificationToast";

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}
