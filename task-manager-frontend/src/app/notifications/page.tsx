"use client";

import { useState } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { Bell, CheckCircle, AlertCircle, X, Trash2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    removeNotification, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    getUnreadCount 
  } = useNotificationStore();
  
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const unreadCount = getUnreadCount();

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
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

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10";
      case "error":
        return "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      case "info":
        return "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
      default:
        return "border-l-4 border-l-gray-500 bg-gray-50 dark:bg-gray-900/10";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {notifications.length} total notifications • {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "read"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "all" 
                  ? "You will see notifications here when tasks are assigned or updated."
                  : `You do not have any ${filter} notifications.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md ${
                  getNotificationStyles(notification.type)
                } ${!notification.isRead ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            New
                          </span>
                        )}
                        {notification.isPersistent && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Persistent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>← Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
