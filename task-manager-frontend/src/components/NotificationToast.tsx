"use client";

import { useState, useEffect } from "react";
import { X, Bell, CheckCircle, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case "info":
      return <Bell className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationStyles = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200 text-green-800";
    case "error":
      return "bg-red-50 border-red-200 text-red-800";
    case "warning":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

export default function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300); // Allow animation to complete
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`rounded-lg border p-4 shadow-lg ${getNotificationStyles(
          notification.type
        )}`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(notification.id), 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
