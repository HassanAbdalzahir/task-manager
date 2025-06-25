"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/user";
import { Search, Users as UsersIcon, Building } from "lucide-react";
import axios from "@/lib/axios";
import UserList from "@/components/UserList";

export default function UsersPage() {
  const { isAuthenticated, workspace } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filterUsers = useCallback(() => {
    // Ensure users is always an array
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchUsers();
  }, [isAuthenticated, router]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/users");
      // Handle the correct response structure from getAllUsers
      const usersData = response.data.data?.users || [];
      const fetchedUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(fetchedUsers);
    } catch (err: unknown) {
      setError("Failed to load users");
      setUsers([]); // Set empty array on error
      console.error("Users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleCount = (role: string) => {
    if (!users || !Array.isArray(users)) {
      return 0;
    }
    return users.filter((user) => user.role === role).length;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Members
          </h1>
          {workspace && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Building className="h-4 w-4" />
              <span>{workspace.name}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage all users under your supervision.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="CEO">CEO ({getRoleCount("CEO")})</option>
              <option value="Manager">
                Manager ({getRoleCount("Manager")})
              </option>
              <option value="Employee">
                Employee ({getRoleCount("Employee")})
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <span className="text-purple-900 dark:text-purple-300 font-bold text-sm">
                  {getRoleCount("CEO")}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                CEO
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400">
                Top level executives
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-blue-900 dark:text-blue-300 font-bold text-sm">
                  {getRoleCount("Manager")}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Managers
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Mid-level supervisors
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-green-900 dark:text-green-300 font-bold text-sm">
                  {getRoleCount("Employee")}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Employees
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Team members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <UserList users={filteredUsers} />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
