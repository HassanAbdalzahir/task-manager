"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Calendar, FileText, Send } from "lucide-react";
import { User as UserType } from "@/types/user";
import { CreateTaskRequest } from "@/types/task";
import axios from "@/lib/axios";
import { useNotificationStore } from "@/store/notificationStore";

interface AssignTaskFormProps {
  subordinates: UserType[];
  onTaskCreated: () => void;
}

export default function AssignTaskForm({
  subordinates,
  onTaskCreated,
}: AssignTaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskRequest>();

  const onSubmit = async (data: CreateTaskRequest) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/tasks", data);

      // Handle different possible response structures
      const taskData =
        response.data.task || response.data.data?.task || response.data;
      const task = taskData;

      reset();
      onTaskCreated();

      // Show success notification
      addNotification({
        type: "success",
        title: "Task Created Successfully",
        message: `Task "${task.title}" has been assigned to ${
          task.assignedTo?.name || "selected user"
        }`,
        duration: 5000,
      });
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : err instanceof Error
          ? err.message
          : "Failed to create task";

      setError(errorMessage);

      // Show error notification
      addNotification({
        type: "error",
        title: "Task Creation Failed",
        message: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Assign New Task
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Task Title
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("title", { required: "Title is required" })}
              type="text"
              id="title"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title"
            />
          </div>
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            {...register("description", {
              required: "Description is required",
            })}
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="assignedTo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign To
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              {...register("assignedTo", { required: "Please select a user" })}
              id="assignedTo"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a subordinate</option>
              {subordinates.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          {errors.assignedTo && (
            <p className="mt-1 text-sm text-red-600">
              {errors.assignedTo.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deadline (Optional)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("deadline")}
              type="datetime-local"
              id="deadline"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Assign Task
            </>
          )}
        </button>
      </form>
    </div>
  );
}
