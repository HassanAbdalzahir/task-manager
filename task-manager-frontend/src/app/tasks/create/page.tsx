"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/user";
import { ArrowLeft, Plus } from "lucide-react";
import axios from "@/lib/axios";
import AssignTaskForm from "@/components/AssignTaskForm";
import { useNotificationStore } from "@/store/notificationStore";

export default function CreateTaskPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubordinates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      let endpoint = "/users/subordinates";
      if (user?.role === "CEO") {
        // CEO can assign tasks to anyone in the system
        endpoint = "/users";
      }

      const response = await axios.get(endpoint);
      const usersData =
        response.data.data?.users ||
        response.data.data?.subordinates ||
        response.data.users ||
        response.data.subordinates ||
        response.data ||
        [];
      const fetchedSubordinates = Array.isArray(usersData) ? usersData : [];

      setSubordinates(fetchedSubordinates);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load subordinates";
      setError(errorMessage);
      addNotification({
        type: "error",
        title: "Failed to Load Subordinates",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, addNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only allow managers and CEOs to create tasks
    if (user?.role === "Employee") {
      router.push("/dashboard");
      return;
    }

    fetchSubordinates();
  }, [isAuthenticated, router, user, fetchSubordinates]);

  const handleTaskCreated = () => {
    addNotification({
      type: "success",
      title: "Task Created",
      message: "Task has been created successfully!",
      duration: 3000,
    });
    router.push("/tasks");
  };

  if (!isAuthenticated || user?.role === "Employee") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Task
            </h1>
            <p className="text-gray-600">
              Assign a new task to your subordinates
            </p>
          </div>
        </div>
      </div>

      {/* Task Creation Form */}
      <div className="max-w-2xl">
        {subordinates.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Subordinates Found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to have subordinates before you can assign tasks.
                    Please create some users first.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AssignTaskForm
            subordinates={subordinates}
            onTaskCreated={handleTaskCreated}
          />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
