"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Task } from "@/types/task";
import {
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  Send,
  Clock,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import axios from "@/lib/axios";
import { useNotificationStore } from "@/store/notificationStore";

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [taskId, setTaskId] = useState<string>("");

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`/tasks/${taskId}`);
      setTask(response.data.data.task);
    } catch (err: unknown) {
      setError("Failed to load task details");
      console.error("Task detail error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTaskId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (taskId) {
      fetchTask();
    }
  }, [isAuthenticated, router, taskId, fetchTask]);

  const updateTaskStatus = async (
    status: "pending" | "in_progress" | "completed"
  ) => {
    if (!task) return;

    try {
      setIsUpdatingStatus(true);
      const response = await axios.put(`/tasks/${task._id}/status`, { status });
      setTask(response.data.data.task);

      // Show success notification
      addNotification({
        type: "success",
        title: "Status Updated",
        message: `Task "${task.title}" status changed to ${getStatusText(
          status
        )}`,
        duration: 4000,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update task status";
      setError(errorMessage);

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

  const addComment = async () => {
    if (!task || !newComment.trim()) return;

    try {
      setIsAddingComment(true);
      const response = await axios.post(`/tasks/${task._id}/comments`, {
        message: newComment.trim(),
      });
      setTask(response.data.data.task);
      setNewComment("");

      // Show success notification
      addNotification({
        type: "success",
        title: "Comment Added",
        message: "Your comment has been added to the task",
        duration: 3000,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add comment";
      setError(errorMessage);

      addNotification({
        type: "error",
        title: "Comment Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Task not found
        </h2>
        <p className="text-gray-600 mb-4">
          The task you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/tasks")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const canUpdateStatus =
    task.assignedTo._id === user?._id || user?.role === "CEO";
  const canAddComments = true; // All authenticated users can comment

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/tasks")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>

      {/* Task Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {task.title}
            </h1>
            <p className="text-gray-600">{task.description}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusText(task.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>Assigned to: {task.assignedTo.name}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>Created by: {task.createdBy.name}</span>
            </div>
            {task.deadline && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span
                  className={
                    isOverdue ? "text-red-600 font-medium" : "text-gray-600"
                  }
                >
                  Due: {format(new Date(task.deadline), "MMM dd, yyyy HH:mm")}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                Created:{" "}
                {format(new Date(task.createdAt), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
          </div>

          {/* Status Update */}
          {canUpdateStatus && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Edit3 className="h-4 w-4 mr-2" />
                Update Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateTaskStatus("pending")}
                  disabled={isUpdatingStatus || task.status === "pending"}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    task.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Pending
                </button>
                <button
                  onClick={() => updateTaskStatus("in_progress")}
                  disabled={isUpdatingStatus || task.status === "in_progress"}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    task.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => updateTaskStatus("completed")}
                  disabled={isUpdatingStatus || task.status === "completed"}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Completed
                </button>
              </div>
              {isUpdatingStatus && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating status...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Comments ({task.comments.length})
          </h3>
        </div>

        {/* Add Comment */}
        {canAddComments && (
          <div className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && addComment()}
                disabled={isAddingComment}
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim() || isAddingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingComment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {task.comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          ) : (
            task.comments.map((comment) => (
              <div
                key={comment._id}
                className="border-l-4 border-gray-200 pl-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.createdBy.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.createdAt), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{comment.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
