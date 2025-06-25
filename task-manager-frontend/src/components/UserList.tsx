"use client";

import { User } from "@/types/user";
import { Crown, Users, User as UserIcon } from "lucide-react";

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CEO":
        return (
          <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        );
      case "Manager":
        return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "Employee":
        return (
          <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        );
      default:
        return (
          <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "CEO":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200";
      case "Manager":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200";
      case "Employee":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  if (!users || users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Assigned to
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Join Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRoleIcon(user.role)}
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.role !== "CEO" && user.managerId ? (
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                      <span
                        className="truncate max-w-32"
                        title={
                          typeof user.managerId === "object"
                            ? user.managerId.name
                            : "Manager"
                        }
                      >
                        {typeof user.managerId === "object"
                          ? user.managerId.name
                          : "Manager"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <div
              key={user._id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span
                        className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {user.email}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      <span>
                        {user.role !== "CEO" && user.managerId
                          ? typeof user.managerId === "object"
                            ? user.managerId.name
                            : "Manager"
                          : "No manager"}
                      </span>
                    </div>
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
