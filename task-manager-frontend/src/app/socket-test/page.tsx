"use client";

import { useEffect, useState } from "react";
import { initializeSocket, disconnectSocket } from "@/lib/socket";

export default function SocketTestPage() {
  const [socketStatus, setSocketStatus] = useState<string>("Disconnected");
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Test socket connection
    const testSocket = () => {
      try {
        // Use a test token for now
        const testToken = "test-token-123";
        const socket = initializeSocket(testToken);

        setSocketStatus("Connecting...");

        socket.on("connect", () => {
          setSocketStatus("Connected");
          setNotifications((prev) => [
            ...prev,
            "✅ Socket connected successfully",
          ]);
        });

        socket.on("disconnect", () => {
          setSocketStatus("Disconnected");
          setNotifications((prev) => [...prev, "❌ Socket disconnected"]);
        });

        socket.on("connect_error", (error) => {
          setSocketStatus("Connection Error");
          setNotifications((prev) => [
            ...prev,
            `🔴 Connection error: ${error.message}`,
          ]);
        });

        // Test task events
        socket.on("task:assigned", (data) => {
          setNotifications((prev) => [
            ...prev,
            `📋 Task assigned: ${JSON.stringify(data)}`,
          ]);
        });

        socket.on("task:updated", (data) => {
          setNotifications((prev) => [
            ...prev,
            `📝 Task updated: ${JSON.stringify(data)}`,
          ]);
        });

        socket.on("task:completed", (data) => {
          setNotifications((prev) => [
            ...prev,
            `✅ Task completed: ${JSON.stringify(data)}`,
          ]);
        });

        socket.on("task:deadline", (data) => {
          setNotifications((prev) => [
            ...prev,
            `⏰ Task deadline: ${JSON.stringify(data)}`,
          ]);
        });

        socket.on("task:comment", (data) => {
          setNotifications((prev) => [
            ...prev,
            `💬 Task comment: ${JSON.stringify(data)}`,
          ]);
        });
      } catch (error) {
        setSocketStatus("Error");
        setNotifications((prev) => [...prev, `🔴 Error: ${error}`]);
      }
    };

    testSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Socket.io Test Page
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Connection Status
          </h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                socketStatus === "Connected"
                  ? "bg-green-500"
                  : socketStatus === "Connecting..."
                  ? "bg-yellow-500"
                  : socketStatus === "Connection Error"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            ></div>
            <span className="text-gray-700 dark:text-gray-300">
              {socketStatus}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Socket Events Log
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No events received yet...
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {notification}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            This page tests the Socket.io connection and displays real-time
            events.
          </p>
          <p>
            Expected behavior: Connection error due to invalid token (this is
            normal for testing).
          </p>
        </div>
      </div>
    </div>
  );
}
