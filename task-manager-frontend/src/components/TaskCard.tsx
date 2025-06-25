"use client";

import { Task } from "@/types/task";
import { format } from "date-fns";
import { Calendar, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded";
      case "in_progress":
        return "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded";
      case "pending":
        return "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded";
      default:
        return "text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 px-2 py-1 rounded";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (deadline?: string) => {
    if (!deadline)
      return "bg-gray-400 dark:bg-gray-700 text-white dark:text-gray-200 border border-gray-500 dark:border-gray-600";

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffInHours =
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (deadlineDate < now)
      return "bg-red-200 dark:bg-red-900/20 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800";
    if (diffInHours <= 24)
      return "bg-red-500 dark:bg-orange-900/40 text-white dark:text-orange-200 border border-red-600 dark:border-orange-800";
    if (diffInHours <= 72)
      return "bg-yellow-200 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800";
    return "bg-green-200 dark:bg-green-900/20 text-green-900 dark:text-green-200 border border-green-300 dark:border-green-800";
  };

  const getPriorityText = (deadline?: string) => {
    if (!deadline) return "No deadline";

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffInHours =
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (deadlineDate < now) return "Overdue";
    if (diffInHours <= 24) return "Urgent";
    if (diffInHours <= 72) return "Soon";
    return "Normal";
  };

  return (
    <Link href={`/tasks/${task._id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {task.title}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
              task.deadline
            )}`}
          >
            {getPriorityText(task.deadline)}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {task.description}
        </p>

        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {task.deadline
                ? format(new Date(task.deadline), "MMM dd, yyyy")
                : "No due date"}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{task.assignedTo?.name || "Unassigned"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`flex items-center space-x-1 text-sm font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {getStatusIcon(task.status)}
              <span className="capitalize">
                {task.status.replace("_", " ")}
              </span>
            </span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created by: {task.createdBy?.name || "Unknown"}
          </div>
        </div>
      </div>
    </Link>
  );
}
