"use client";

import { useAuthStore } from "@/store/authStore";
import { LogOut, User, Bell, Building } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { disconnectSocket } from "@/lib/socket";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useEffect } from "react";
import axios from "@/lib/axios";

export default function Header() {
  const { user, workspace, logout, updateWorkspace } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/login");
  };

  // Fetch workspace data if not available
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (user && !workspace) {
        try {
          const response = await axios.get("/auth/workspace");
          const workspaceData =
            response.data.data?.workspace || response.data.workspace;
          if (workspaceData) {
            updateWorkspace(workspaceData);
          }
        } catch (error) {
          console.error("Failed to fetch workspace:", error);
        }
      }
    };

    fetchWorkspace();
  }, [user, workspace, updateWorkspace]);

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              NanoTask
            </Link>
            {workspace && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Building className="h-4 w-4" />
                <span>{workspace.name}</span>
              </div>
            )}
          </div>

          <nav className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Tasks
            </Link>
            {user.role !== "Employee" && (
              <Link
                href="/tasks/create"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Task
              </Link>
            )}
            <Link
              href="/users"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Users
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            <DarkModeToggle />

            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
