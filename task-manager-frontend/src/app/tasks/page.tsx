"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Task } from "@/types/task";
import { Plus, Filter, Search, RefreshCw } from "lucide-react";
import axios from "@/lib/axios";
import TaskCard from "@/components/TaskCard";
import { useNotificationStore } from "@/store/notificationStore";

type TaskFilter = "all" | "assigned" | "created" | "subordinates";
type TaskStatus = "all" | "pending" | "in_progress" | "completed";

export default function TasksPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      let endpoint = "";
      if (filter === "assigned") {
        endpoint = "/tasks/assigned";
      } else if (filter === "created") {
        endpoint = "/tasks/created";
      } else if (filter === "subordinates") {
        endpoint = "/tasks/subordinates";
      } else if (filter === "all") {
        if (user?.role === "Employee") {
          endpoint = "/tasks/assigned";
        } else if (user?.role === "Manager") {
          endpoint = "/tasks/assigned";
        } else {
          // CEO sees subordinates tasks by default
          endpoint = "/tasks/subordinates";
        }
      }

      const response = await axios.get(endpoint);

      // Handle different possible response structures
      const tasksData =
        response.data.data?.tasks || response.data.tasks || response.data || [];

      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMessage);
      setTasks([]); // Set empty array on error
      addNotification({
        type: "error",
        title: "Failed to Load Tasks",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, user?.role, addNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchTasks();
  }, [isAuthenticated, router, fetchTasks]);

  const refreshTasks = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);

    addNotification({
      type: "success",
      title: "Tasks Refreshed",
      message: "Task list has been updated",
      duration: 2000,
    });
  };

  const getFilteredTasks = () => {
    // Ensure tasks is always an array
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    let filteredTasks = tasks;

    // Filter by status
    if (statusFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === statusFilter
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term) ||
          task.assignedTo?.name?.toLowerCase().includes(term) ||
          task.createdBy?.name?.toLowerCase().includes(term)
      );
    }

    return filteredTasks;
  };

  const getFilterLabel = (filterType: TaskFilter) => {
    switch (filterType) {
      case "all":
        return "All Tasks";
      case "assigned":
        return "Assigned to Me";
      case "created":
        return "Created by Me";
      case "subordinates":
        return "Subordinates Tasks";
      default:
        return "All Tasks";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "all":
        return "All Statuses";
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "All Statuses";
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshTasks}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => router.push("/tasks/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Task Type Filter */}
          <div>
            <label
              htmlFor="filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Task Type
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as TaskFilter)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Tasks</option>
                <option value="assigned">Assigned to Me</option>
                <option value="created">Created by Me</option>
                {user?.role !== "Employee" && (
                  <option value="subordinates">Subordinates Tasks</option>
                )}
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="statusFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredTasks.length} of {tasks.length} tasks
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
        <span>
          Filter: {getFilterLabel(filter)} • {getStatusLabel(statusFilter)}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tasks Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? `No tasks match your search "${searchTerm}"`
                  : `No tasks found for the selected filters`}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} onUpdate={fetchTasks} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
