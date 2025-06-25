"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { initializeSocket } from "@/lib/socket";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Plus,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import axios from "@/lib/axios";
import TaskCard from "@/components/TaskCard";
import UserList from "@/components/UserList";
import AssignTaskForm from "@/components/AssignTaskForm";
import CreateUserForm from "@/components/CreateUserForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  subordinatesCount: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    subordinatesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "users">(
    "overview"
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch tasks based on user role
      let tasksResponse;
      if (user?.role === "Employee") {
        // Employees only see tasks assigned to them
        tasksResponse = await axios.get("/tasks/assigned");
      } else if (user?.role === "Manager") {
        // Managers see tasks assigned to them AND tasks they created
        const [assignedResponse, createdResponse] = await Promise.all([
          axios.get("/tasks/assigned"),
          axios.get("/tasks/created"),
        ]);

        // Combine both arrays, removing duplicates by task ID
        const assignedTasks =
          assignedResponse.data.data?.tasks ||
          assignedResponse.data.tasks ||
          assignedResponse.data ||
          [];
        const createdTasks =
          createdResponse.data.data?.tasks ||
          createdResponse.data.tasks ||
          createdResponse.data ||
          [];

        const allTasks = [...assignedTasks];
        const assignedTaskIds = new Set(
          assignedTasks.map((task: Task) => task._id)
        );

        // Add created tasks that aren't already in assigned tasks
        createdTasks.forEach((task: Task) => {
          if (!assignedTaskIds.has(task._id)) {
            allTasks.push(task);
          }
        });

        tasksResponse = { data: { data: { tasks: allTasks } } };
      } else {
        // CEO sees subordinates tasks by default
        tasksResponse = await axios.get("/tasks/subordinates");
      }

      // Fetch subordinates/users
      const subordinatesResponse =
        user?.role !== "Employee"
          ? await axios.get(
              user?.role === "CEO" ? "/users" : "/users/subordinates"
            )
          : { data: { data: { users: [] } } };

      // Handle different possible response structures for tasks
      const tasksData =
        tasksResponse.data.data?.tasks ||
        tasksResponse.data.tasks ||
        tasksResponse.data ||
        [];
      const fetchedTasks = Array.isArray(tasksData) ? tasksData : [];

      // Handle different possible response structures for users based on role
      let fetchedSubordinates: User[] = [];
      if (user?.role === "CEO") {
        // CEO gets all users from /users endpoint
        const usersData = subordinatesResponse.data.data?.users || [];
        fetchedSubordinates = Array.isArray(usersData) ? usersData : [];
      } else if (user?.role === "Manager") {
        // Manager gets subordinates from /users/subordinates endpoint
        const subordinatesData =
          subordinatesResponse.data.data?.subordinates || [];
        fetchedSubordinates = Array.isArray(subordinatesData)
          ? subordinatesData
          : [];
      }

      setTasks(fetchedTasks);
      setSubordinates(fetchedSubordinates);

      // Calculate task stats
      const newStats = {
        totalTasks: fetchedTasks.length,
        pendingTasks: fetchedTasks.filter(
          (task: Task) => task.status === "pending"
        ).length,
        inProgressTasks: fetchedTasks.filter(
          (task: Task) => task.status === "in_progress"
        ).length,
        completedTasks: fetchedTasks.filter(
          (task: Task) => task.status === "completed"
        ).length,
        overdueTasks: fetchedTasks.filter(
          (task: Task) => task.deadline && new Date(task.deadline) < new Date()
        ).length,
        subordinatesCount: fetchedSubordinates.length,
      };
      setStats(newStats);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      addNotification({
        type: "error",
        title: "Dashboard Error",
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

    // Initialize socket connection for real-time notifications
    if (user) {
      // Get token from localStorage or auth store
      const token = localStorage.getItem("accessToken");
      if (token) {
        const socket = initializeSocket(token);

        // Listen for socket events to refresh data
        socket.on("task:assigned", () => {
          fetchDashboardData();
        });

        socket.on("task:updated", () => {
          fetchDashboardData();
        });

        socket.on("task:completed", () => {
          fetchDashboardData();
        });

        socket.on("task:comment", () => {
          fetchDashboardData();
        });
      }
    }

    fetchDashboardData();
  }, [isAuthenticated, router, user, fetchDashboardData]);

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    fetchDashboardData();
  };

  const handleUserCreated = () => {
    setShowUserForm(false);
    fetchDashboardData();
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show password change form if required
  if (user?.requiresPasswordChange) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <ChangePasswordForm
          isRequired={true}
          onSuccess={() => {
            // Password changed successfully, user will be updated in store
            // and requiresPasswordChange will be false
          }}
        />
      </div>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {user?.name}!
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role !== "Employee" && (
            <button
              onClick={() => setShowUserForm(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Create User
            </button>
          )}
          {user?.role !== "Employee" && subordinates.length > 0 && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pendingTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.inProgressTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.completedTasks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {stats.overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              You have {stats.overdueTasks} overdue task
              {stats.overdueTasks !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tasks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks ({tasks.length})
            </button>
            {user?.role !== "Employee" && (
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Users ({subordinates.length})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Recent Tasks
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-gray-500">No tasks found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.slice(0, 6).map((task) => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  All Tasks
                </h3>
                <button
                  onClick={() => router.push("/tasks")}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && user?.role !== "Employee" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Subordinates
              </h3>
              <UserList users={subordinates} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <AssignTaskForm
                subordinates={subordinates}
                onTaskCreated={handleTaskCreated}
              />
              <button
                onClick={() => setShowTaskForm(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <CreateUserForm onUserCreated={handleUserCreated} />
              <button
                onClick={() => setShowUserForm(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
