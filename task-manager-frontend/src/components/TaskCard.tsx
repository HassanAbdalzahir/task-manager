"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Task } from "@/types/task";
import {
  User,
  Clock,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import axios from "@/lib/axios";
import { useNotificationStore } from "@/store/notificationStore";

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusUpdate = async (
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    if (task.assignedTo._id !== user?._id) return;

    try {
      setIsUpdatingStatus(true);
      await axios.put(`/tasks/${task._id}/status`, {
        status: newStatus,
      });

      // Show success notification
      addNotification({
        type: "success",
        title: "Status Updated",
        message: `Task "${task.title}" status changed to ${getStatusText(
          newStatus
        )}`,
        duration: 4000,
      });

      onUpdate();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      addNotification({
        type: "error",
        title: "Update Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getPriorityColor = () => {
    if (!task.deadline) return "text-gray-500";

    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (deadline < now) return "text-red-600";
    if (diffInHours <= 24) return "text-orange-600";
    if (diffInHours <= 72) return "text-yellow-600";
    return "text-green-600";
  };

  const getPriorityIcon = () => {
    if (!task.deadline) return <Clock className="h-4 w-4" />;

    const deadline = new Date(task.deadline);
    if (deadline < new Date()) return <AlertCircle className="h-4 w-4" />;

    const now = new Date();
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours <= 24) return <AlertCircle className="h-4 w-4" />;
    if (diffInHours <= 72) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const canUpdateStatus = task.assignedTo._id === user?._id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
          </div>
          <span
            className={`ml-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusText(task.status)}
          </span>
        </div>

        {/* Task Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              Assigned to: {task.assignedTo.name}
            </span>
          </div>

          {task.deadline && (
            <div className={`flex items-center text-sm ${getPriorityColor()}`}>
              {getPriorityIcon()}
              <span className="ml-2">
                Due: {format(new Date(task.deadline), "MMM dd, yyyy HH:mm")}
                {new Date(task.deadline) < new Date() && " (Overdue)"}
              </span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              Created: {format(new Date(task.createdAt), "MMM dd, yyyy")}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {task.comments.length} comment
              {task.comments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Status Update Buttons */}
        {canUpdateStatus && task.status !== "completed" && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusUpdate("pending")}
                disabled={isUpdatingStatus || task.status === "pending"}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  task.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusUpdate("in_progress")}
                disabled={isUpdatingStatus || task.status === "in_progress"}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  task.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdatingStatus}
                className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete
              </button>
            </div>
            {isUpdatingStatus && (
              <div className="flex items-center text-xs text-gray-500 mt-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Updating...
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push(`/tasks/${task._id}`)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
