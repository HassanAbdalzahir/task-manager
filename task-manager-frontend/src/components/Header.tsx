"use client";

import { useAuthStore } from "@/store/authStore";
import { LogOut, User, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { disconnectSocket } from "@/lib/socket";

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Task Manager
            </Link>
          </div>

          <nav className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasks
            </Link>
            {user.role !== "Employee" && (
              <Link
                href="/tasks/create"
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Create Task
              </Link>
            )}
            <Link
              href="/users"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Users
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
